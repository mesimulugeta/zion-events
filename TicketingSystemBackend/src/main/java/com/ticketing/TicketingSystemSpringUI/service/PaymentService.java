package com.ticketing.TicketingSystemSpringUI.service;

import com.ticketing.TicketingSystemSpringUI.domain.Payment;
import com.ticketing.TicketingSystemSpringUI.domain.Reservation;
import com.ticketing.TicketingSystemSpringUI.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.client.RestClientException;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    // Typed response shape used for every Chapa call (no raw Map, no unchecked casts)
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<Map<String, Object>>() {};

    @Value("${chapa.secret_key}")
    private String secretKey;

    @Value("${chapa.base_url}")
    private String chapaBaseUrl;

    private final RestTemplate restTemplate;
    private final ReservationService reservationService;
    private final PaymentRepository paymentRepository;

    public PaymentService(ReservationService reservationService,
                          PaymentRepository paymentRepository) {
        this.restTemplate = new RestTemplate();
        this.reservationService = reservationService;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public String initializePayment(long reservationId, String returnUrl, String firstName) throws Exception {
        Reservation reservation = reservationService.getReservationById(reservationId);
        BigDecimal amount = reservation.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Invalid reservation amount");
        }

        String txRef = "TX-" + reservationId + "-" + System.currentTimeMillis();

        Payment payment = new Payment();
        payment.setReservationId(reservationId);
        payment.setTxRef(txRef);
        payment.setAmount(amount);
        payment.setCurrency("ETB");
        payment.setStatus("PENDING");
        paymentRepository.save(payment);

        String baseUrl = returnUrl.endsWith("/") ? returnUrl.substring(0, returnUrl.length() - 1) : returnUrl;
        String finalReturnUrl = baseUrl + "/" + reservationId + "?tx_ref=" + txRef;

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("amount", amount.toString());
        requestBody.put("currency", "ETB");
        requestBody.put("email", reservation.getCustomerEmail());
        requestBody.put("tx_ref", txRef);
        requestBody.put("callback_url", finalReturnUrl);
        requestBody.put("return_url", finalReturnUrl);
        requestBody.put("first_name", firstName);
        requestBody.put("last_name", "");
        requestBody.put("title", "Event Booking");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(secretKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    chapaBaseUrl + "/transaction/initialize",
                    HttpMethod.POST,
                    entity,
                    MAP_TYPE);

            Map<String, Object> body = response.getBody();

            if (response.getStatusCode() != HttpStatus.OK || body == null) {
                payment.setStatus("FAILED");
                payment.setChapaStatus(truncate("http_error: " + response.getStatusCode(), 255));
                paymentRepository.update(payment);
                throw new RuntimeException("Chapa API error: " + response.getStatusCode());
            }

            if (!"success".equals(body.get("status"))) {
                String errorMsg = String.valueOf(body.get("message"));
                payment.setStatus("FAILED");
                payment.setChapaStatus(truncate("initiation_failed: " + errorMsg, 255));
                paymentRepository.update(payment);
                throw new RuntimeException("Chapa initiation failed: " + errorMsg);
            }

            String checkoutUrl = dataField(body, "checkout_url");
            if (checkoutUrl == null) {
                throw new RuntimeException("Chapa did not return a checkout URL");
            }

            payment.setChapaStatus(truncate("initiated", 255));
            paymentRepository.update(payment);
            return checkoutUrl;

        } catch (RuntimeException e) {
            log.error("Failed to initialize payment for reservation {}: {}", reservationId, e.getMessage(), e);
            payment.setStatus("FAILED");
            payment.setChapaStatus(truncate("exception: " + e.getMessage(), 255));
            paymentRepository.update(payment);
            throw e;
        }
    }

    @Transactional
    public boolean verifyAndConfirmPayment(String txRef) throws Exception {
        log.info("=== VERIFYING PAYMENT for txRef: {} ===", txRef);

        Payment payment = paymentRepository.findByTxRef(txRef);
        if (payment == null) {
            log.warn("No payment record found for txRef: {}", txRef);
            return false;
        }

        if ("COMPLETED".equals(payment.getStatus())) {
            log.info("Payment already COMPLETED for txRef: {}", txRef);
            return true;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(secretKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    chapaBaseUrl + "/transaction/verify/" + txRef,
                    HttpMethod.GET,
                    entity,
                    MAP_TYPE);

            Map<String, Object> body = response.getBody();

            log.info("Chapa verify HTTP status: {}", response.getStatusCode());
            log.info("Chapa verify response body: {}", body);

            if (response.getStatusCode() != HttpStatus.OK || body == null) {
                log.error("Chapa verification HTTP error: {}", response.getStatusCode());
                return false;
            }

            if (!"success".equals(body.get("status"))) {
                log.warn("Chapa API response status is not 'success': {}", body.get("status"));
                markFailed(payment);
                return false;
            }

            String transactionStatus = dataField(body, "status");

            payment.setChapaStatus(truncate(transactionStatus, 500));
            paymentRepository.update(payment);

            if (!"success".equals(transactionStatus)) {
                log.warn("Transaction status from Chapa data is not success: {}", transactionStatus);
                markFailed(payment);
                return false;
            }

            payment.setStatus("COMPLETED");
            paymentRepository.update(payment);

            log.info("Calling confirmReservation for reservationId: {}", payment.getReservationId());
            reservationService.confirmReservation(payment.getReservationId());
            reservationService.updatePaymentStatus(payment.getReservationId(), "PAID");

            log.info("Payment CONFIRMED for txRef: {}", txRef);
            return true;

        } catch (RestClientException e) {
            log.error("Exception during payment verification for txRef {}: {}", txRef, e.getMessage(), e);
            throw new RuntimeException("Verification failed: " + e.getMessage(), e);
        }
    }

    public Payment getPaymentByTxRef(String txRef) {
        return paymentRepository.findByTxRef(txRef);
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload) {
        String txRef = (String) payload.get("tx_ref");
        if (txRef == null) {
            log.error("Webhook missing tx_ref");
            return;
        }
        log.info("Received webhook for txRef: {}", txRef);
        try {
            verifyAndConfirmPayment(txRef);
        } catch (Exception e) {
            log.error("Webhook processing error", e);
        }
    }

    // ---------- Helpers ----------

    private void markFailed(Payment payment) {
        payment.setStatus("FAILED");
        paymentRepository.update(payment);
        reservationService.updatePaymentStatus(payment.getReservationId(), "FAILED");
    }

    // Reads body.data.<key> as a String without unchecked casts
    private String dataField(Map<String, Object> body, String key) {
        Object dataObj = body.get("data");
        if (dataObj instanceof Map) {
            Object value = ((Map<?, ?>) dataObj).get(key);
            return value == null ? null : value.toString();
        }
        return null;
    }

    private String truncate(String str, int maxLength) {
        if (str == null) return null;
        return str.length() <= maxLength ? str : str.substring(0, maxLength);
    }
}
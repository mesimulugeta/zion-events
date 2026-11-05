package com.ticketing.TicketingSystemSpringUI.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketing.TicketingSystemSpringUI.domain.Payment;
import com.ticketing.TicketingSystemSpringUI.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @Value("${chapa.webhook_hash:}")
    private String webhookHash;

    public PaymentController(PaymentService paymentService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        String txRef = body.get("tx_ref");
        if (txRef == null || txRef.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "failed", "message", "Missing tx_ref"));
        }

        try {
            boolean success = paymentService.verifyAndConfirmPayment(txRef);
            if (success) {
                Payment payment = paymentService.getPaymentByTxRef(txRef);
                return ResponseEntity.ok(Map.of(
                    "status", "paid",
                    "reservationId", payment.getReservationId()
                ));
            } else {
                return ResponseEntity.status(400).body(Map.of("status", "failed", "message", "Payment verification failed"));
            }
        } catch (Exception e) {
            log.error("Payment verification error for txRef {}: {}", txRef, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("status", "error", "error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody String payload,
                                     @RequestHeader(value = "x-chapa-signature", required = false) String chapaSignature) {
        if (webhookHash != null && !webhookHash.isEmpty()) {
            if (chapaSignature == null) {
                return ResponseEntity.status(400).body("Missing signature");
            }
            try {
                Mac mac = Mac.getInstance("HmacSHA256");
                SecretKeySpec secretKeySpec = new SecretKeySpec(webhookHash.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
                mac.init(secretKeySpec);
                byte[] computedHash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
                String computedHex = HexFormat.of().formatHex(computedHash);
                if (!computedHex.equalsIgnoreCase(chapaSignature)) {
                    return ResponseEntity.status(400).body("Invalid signature");
                }
            } catch (IllegalStateException | InvalidKeyException | NoSuchAlgorithmException e) {
                log.error("Webhook signature check failed", e);
                return ResponseEntity.status(400).body("Signature error");
            }
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = objectMapper.readValue(payload, Map.class);
            paymentService.handleWebhook(body);
            return ResponseEntity.ok(Map.of("message", "ok"));
        } catch (JsonProcessingException e) {
            log.error("Webhook processing failed", e);
            return ResponseEntity.status(500).body("Error");
        }
    }
}
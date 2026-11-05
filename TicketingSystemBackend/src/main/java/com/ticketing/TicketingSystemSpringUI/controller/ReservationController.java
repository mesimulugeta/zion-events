package com.ticketing.TicketingSystemSpringUI.controller;

import com.ticketing.TicketingSystemSpringUI.domain.Event;
import com.ticketing.TicketingSystemSpringUI.domain.Reservation;
import com.ticketing.TicketingSystemSpringUI.domain.ReservationStatus;
import com.ticketing.TicketingSystemSpringUI.domain.Seat;
import com.ticketing.TicketingSystemSpringUI.domain.SeatCategory;
import com.ticketing.TicketingSystemSpringUI.domain.User;
import com.ticketing.TicketingSystemSpringUI.repository.UserRepository;
import com.ticketing.TicketingSystemSpringUI.service.EventService;
import com.ticketing.TicketingSystemSpringUI.service.PaymentService;
import com.ticketing.TicketingSystemSpringUI.service.ReservationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final EventService eventService;

    @Value("${chapa.return_url}")
    private String returnUrl;

    public ReservationController(ReservationService reservationService,
                                 UserRepository userRepository,
                                 PaymentService paymentService,
                                 EventService eventService) {
        this.reservationService = reservationService;
        this.userRepository = userRepository;
        this.paymentService = paymentService;
        this.eventService = eventService;
    }

    @GetMapping("/my")
    public ResponseEntity<?> myReservations(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));

        String customerEmail = user.getEmail();
        List<Reservation> reservations =
                reservationService.getReservationsByCustomer(customerEmail);

        Map<Long, Event> reservationEvents = new HashMap<>();
        Map<Long, List<Seat>> reservationSeats = new HashMap<>();

        for (Reservation res : reservations) {
            reservationEvents.put(res.getId(),
                    reservationService.getEventForReservation(res.getId()));
            reservationSeats.put(res.getId(),
                    reservationService.getSeatsForReservation(res.getId()));
        }

        return ResponseEntity.ok(Map.of(
                "reservations", reservations,
                "reservationEvents", reservationEvents,
                "reservationSeats", reservationSeats
        ));
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmReservation(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        String customerEmail = user.getEmail();

        long eventId = Long.parseLong(body.get("eventId").toString());

        @SuppressWarnings("unchecked")
        List<Integer> seatIds = (List<Integer>) body.get("seatIds");

        try {
            Event event = eventService.getEventById(eventId);

            // Price each seat individually by its tier (NORMAL / VIP / VVIP)
            Map<Integer, SeatCategory> seatCategories = eventService.getSeatCategories(seatIds);
            Map<Integer, BigDecimal> seatPrices = new HashMap<>();
            BigDecimal totalAmount = BigDecimal.ZERO;

            for (Integer seatId : seatIds) {
                SeatCategory category = seatCategories.getOrDefault(seatId, SeatCategory.NORMAL);
                BigDecimal seatPrice = category.priceFor(event.getPrice());
                seatPrices.put(seatId, seatPrice);
                totalAmount = totalAmount.add(seatPrice);
            }

            long reservationId = reservationService.createHold(
                    seatIds, eventId, customerEmail, totalAmount, seatPrices);

            String checkoutUrl = paymentService.initializePayment(
                    reservationId,
                    returnUrl,
                    username
            );

            return ResponseEntity.ok(Map.of(
                    "checkoutUrl", checkoutUrl,
                    "reservationId", reservationId,
                    "message", "Redirect to payment"
            ));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelReservation(
            @RequestBody Map<String, Long> body,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        long reservationId = body.get("reservationId");
        Reservation r = reservationService.getReservationById(reservationId);

        boolean isAdmin = "ADMIN".equals(user.getRole());
        boolean isOwner = user.getEmail().equals(r.getCustomerEmail());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only cancel your own reservations"));
        }

        if (r.getStatus() == ReservationStatus.CANCELLED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Reservation already cancelled"));
        }

        reservationService.cancelReservation(reservationId, isAdmin);
        return ResponseEntity.ok(Map.of("message", "Reservation cancelled successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReservationById(@PathVariable long id, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Reservation reservation = reservationService.getReservationById(id);

        if (!user.getEmail().equals(reservation.getCustomerEmail()) && !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You cannot view this reservation"));
        }

        Event event = reservationService.getEventForReservation(id);
        List<Seat> seats = reservationService.getSeatsForReservation(id);

        return ResponseEntity.ok(Map.of(
                "reservation", reservation,
                "event", event,
                "seats", seats
        ));
    }
}
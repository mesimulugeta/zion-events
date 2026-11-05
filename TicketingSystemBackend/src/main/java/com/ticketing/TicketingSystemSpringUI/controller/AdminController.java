package com.ticketing.TicketingSystemSpringUI.controller;

import com.ticketing.TicketingSystemSpringUI.domain.Event;
import com.ticketing.TicketingSystemSpringUI.domain.Reservation;
import com.ticketing.TicketingSystemSpringUI.domain.Venue;
import com.ticketing.TicketingSystemSpringUI.service.EventService;
import com.ticketing.TicketingSystemSpringUI.service.ImageUploadService;
import com.ticketing.TicketingSystemSpringUI.service.ReservationService;
import java.io.IOException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final EventService eventService;
    private final ReservationService reservationService;
    private final ImageUploadService imageUploadService;

    public AdminController(EventService eventService,
                           ReservationService reservationService,
                           ImageUploadService imageUploadService) {
        this.eventService = eventService;
        this.reservationService = reservationService;
        this.imageUploadService = imageUploadService;
    }

    @GetMapping("/venues")
    public ResponseEntity<List<Venue>> getAllVenues() {
        return ResponseEntity.ok(eventService.getAllVenues());
    }

    @GetMapping("/events")
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable long id) {
        Event event = eventService.getEventById(id);
        if (event == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(event);
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> body) {
        try {
            long venueId = Long.parseLong(body.get("venueId").toString());
            String title = body.get("title").toString();
            LocalDateTime startAt = LocalDateTime.parse(body.get("startAt").toString());
            LocalDateTime endAt = LocalDateTime.parse(body.get("endAt").toString());
            int availableSeats = Integer.parseInt(body.get("availableSeats").toString());
            String category = body.getOrDefault("category", "OTHER").toString();
            String imageUrl = body.containsKey("imageUrl") ? body.get("imageUrl").toString() : null;
            String venueName = body.containsKey("venueName") ? body.get("venueName").toString() : null;
            String description = body.containsKey("description") ? body.get("description").toString() : null;

            BigDecimal price = body.containsKey("price") ? new BigDecimal(body.get("price").toString()) : BigDecimal.ZERO;
            
            BigDecimal normalPrice = body.containsKey("normalPrice") ? new BigDecimal(body.get("normalPrice").toString()) : price;
            BigDecimal vipPrice = body.containsKey("vipPrice") ? new BigDecimal(body.get("vipPrice").toString()) : null;
            BigDecimal vvipPrice = body.containsKey("vvipPrice") ? new BigDecimal(body.get("vvipPrice").toString()) : null;

            long eventId = eventService.addEvent(venueId, title, startAt, endAt, "ACTIVE",
                    availableSeats, category, imageUrl, venueName, description, price, normalPrice, vipPrice, vvipPrice);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Event created successfully",
                    "eventId", eventId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable long id,
                                         @RequestBody Map<String, Object> body) {
        try {
            String title = body.get("title").toString();
            LocalDateTime startAt = LocalDateTime.parse(body.get("startAt").toString());
            LocalDateTime endAt = LocalDateTime.parse(body.get("endAt").toString());
            String status = body.get("status").toString();
            int availableSeats = Integer.parseInt(body.get("availableSeats").toString());
            String category = body.containsKey("category") ? body.get("category").toString() : null;
            String imageUrl = body.containsKey("imageUrl") ? body.get("imageUrl").toString() : null;
            String venueName = body.containsKey("venueName") ? body.get("venueName").toString() : null;
            String description = body.containsKey("description") ? body.get("description").toString() : null;

            BigDecimal price = body.containsKey("price") ? new BigDecimal(body.get("price").toString()) : null;
            
            BigDecimal normalPrice = body.containsKey("normalPrice") ? new BigDecimal(body.get("normalPrice").toString()) : null;
            BigDecimal vipPrice = body.containsKey("vipPrice") ? new BigDecimal(body.get("vipPrice").toString()) : null;
            BigDecimal vvipPrice = body.containsKey("vvipPrice") ? new BigDecimal(body.get("vvipPrice").toString()) : null;

            boolean updated = eventService.updateEvent(id, title, startAt, endAt, status,
                    availableSeats, category, imageUrl, venueName, description, price, normalPrice, vipPrice, vvipPrice);
            if (!updated) return ResponseEntity.notFound().build();

            return ResponseEntity.ok(Map.of("message", "Event updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/events/{id}/cancel")
    public ResponseEntity<?> cancelEvent(@PathVariable long id) {
        boolean cancelled = eventService.cancelEvent(id);
        if (!cancelled) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("message", "Event cancelled successfully"));
    }

    @PostMapping("/events/{id}/upload-image")
    public ResponseEntity<?> uploadEventImage(@PathVariable long id,
                                              @RequestParam("image") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
            }
            String imageUrl = imageUploadService.uploadImage(file);
            eventService.updateEventImage(id, imageUrl);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/reservations")
    public ResponseEntity<?> getAllReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort.Direction direction = Sort.Direction.fromString(sortDir);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Reservation> reservationPage = reservationService.getReservationsPage(pageable);

        List<Map<String, Object>> content = new ArrayList<>();
        for (Reservation res : reservationPage.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("reservation", res);
            item.put("event", reservationService.getEventForReservation(res.getId()));
            item.put("seats", reservationService.getSeatsForReservation(res.getId()));
            content.add(item);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", reservationPage.getTotalElements());
        response.put("totalPages", reservationPage.getTotalPages());
        response.put("size", reservationPage.getSize());
        response.put("number", reservationPage.getNumber());
        response.put("sort", reservationPage.getSort().toString());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/reservations/{id}/cancel")
    public ResponseEntity<?> cancelReservation(@PathVariable long id) {
        reservationService.adminCancelReservation(id);
        return ResponseEntity.ok(Map.of("message", "Reservation cancelled successfully"));
    }
}
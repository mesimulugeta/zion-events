package com.ticketing.TicketingSystemSpringUI.controller;

import com.ticketing.TicketingSystemSpringUI.domain.Event;
import com.ticketing.TicketingSystemSpringUI.domain.SeatDto;
import com.ticketing.TicketingSystemSpringUI.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class WebController {

    private final EventService eventService;

    public WebController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents(
            @RequestParam(required = false) String category) {

        if (category == null || category.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(eventService.getAllEvents());
        }
        return ResponseEntity.ok(eventService.getEventsByCategory(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable long id) {
        Event event = eventService.getEventById(id);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(event);
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<SeatDto>> getAvailableSeats(@PathVariable long id) {
        return ResponseEntity.ok(
                eventService.getAvailableSeatsForEvent(id)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<List<Event>> searchEvents(
            @RequestParam String keyword) {
        return ResponseEntity.ok(
                eventService.searchEventsByTitle(keyword)
        );
    }
}
package com.ticketing.TicketingSystemSpringUI.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "venue_id")
    private Long venueId;

    private String title;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    private String status;

    @Column(name = "available_seats")
    private int availableSeats;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "category")
    private String category;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "venue_name")
    private String venueName;

    @Column(name = "description")
    private String description;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "normal_price")
    private BigDecimal normalPrice;

    @Column(name = "vip_price")
    private BigDecimal vipPrice;

    @Column(name = "vvip_price")
    private BigDecimal vvipPrice;

    public Event() {
    }

    public Event(Long venueId,
                 String title,
                 LocalDateTime startAt,
                 LocalDateTime endAt,
                 String status,
                 int availableSeats) {

        this.venueId = venueId;
        this.title = title;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = status;
        this.availableSeats = availableSeats;
    }

    public Event(Long id,
                 Long venueId,
                 String title,
                 LocalDateTime startAt,
                 LocalDateTime endAt,
                 String status,
                 int availableSeats) {

        this.id = id;
        this.venueId = venueId;
        this.title = title;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = status;
        this.availableSeats = availableSeats;
    }

    public Event(Long id,
                 Long venueId,
                 String title,
                 LocalDateTime startAt,
                 LocalDateTime endAt,
                 String status,
                 int availableSeats,
                 LocalDateTime createdAt) {

        this.id = id;
        this.venueId = venueId;
        this.title = title;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = status;
        this.availableSeats = availableSeats;
        this.createdAt = createdAt;
    }

    public Event(Long id,
                 Long venueId,
                 String title,
                 LocalDateTime startAt,
                 LocalDateTime endAt,
                 String status,
                 int availableSeats,
                 LocalDateTime createdAt,
                 String category,
                 String imageUrl,
                 String venueName,
                 String description) {

        this.id = id;
        this.venueId = venueId;
        this.title = title;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = status;
        this.availableSeats = availableSeats;
        this.createdAt = createdAt;
        this.category = category;
        this.imageUrl = imageUrl;
        this.venueName = venueName;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVenueId() { return venueId; }
    public void setVenueId(Long venueId) { this.venueId = venueId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getNormalPrice() { return normalPrice; }
    public void setNormalPrice(BigDecimal normalPrice) { this.normalPrice = normalPrice; }
    public BigDecimal getVipPrice() { return vipPrice; }
    public void setVipPrice(BigDecimal vipPrice) { this.vipPrice = vipPrice; }
    public BigDecimal getVvipPrice() { return vvipPrice; }
    public void setVvipPrice(BigDecimal vvipPrice) { this.vvipPrice = vvipPrice; }
}
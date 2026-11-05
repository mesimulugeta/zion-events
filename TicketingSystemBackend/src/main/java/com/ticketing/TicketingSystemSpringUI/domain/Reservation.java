package com.ticketing.TicketingSystemSpringUI.domain;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public class Reservation {
    private long id;
    private long eventId;
    private String customerEmail;
    private ReservationStatus status;
    private ZonedDateTime holdExpiresAt;
    private BigDecimal amount;          // NEW
    private String paymentStatus;       // NEW (PENDING, PAID, FAILED)

    public Reservation(long id, long eventId, String customerEmail,
                       ReservationStatus status, ZonedDateTime holdExpiresAt) {
        this.id = id;
        this.eventId = eventId;
        this.customerEmail = customerEmail;
        this.status = status;
        this.holdExpiresAt = holdExpiresAt;
    }

    public long getId() { return id; }
    public long getEventId() { return eventId; }
    public String getCustomerEmail() { return customerEmail; }
    public ReservationStatus getStatus() { return status; }
    public ZonedDateTime getHoldExpiresAt() { return holdExpiresAt; }

    public void setStatus(ReservationStatus status) { this.status = status; }
    public void setHoldExpiresAt(ZonedDateTime holdExpiresAt) { this.holdExpiresAt = holdExpiresAt; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
}
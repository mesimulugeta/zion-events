package com.ticketing.TicketingSystemSpringUI.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Payment {
    private Long id;
    private Long reservationId;
    private String txRef;
    private BigDecimal amount;
    private String currency = "ETB";
    private String status;          // PENDING, COMPLETED, FAILED
    private String chapaStatus;     // raw status from Chapa
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }
    public String getTxRef() { return txRef; }
    public void setTxRef(String txRef) { this.txRef = txRef; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getChapaStatus() { return chapaStatus; }
    public void setChapaStatus(String chapaStatus) { this.chapaStatus = chapaStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
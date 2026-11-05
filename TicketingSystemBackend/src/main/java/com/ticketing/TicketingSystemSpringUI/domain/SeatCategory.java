package com.ticketing.TicketingSystemSpringUI.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum SeatCategory {
    NORMAL(BigDecimal.ONE),
    VIP(new BigDecimal("1.5")),
    VVIP(new BigDecimal("2.0"));

    private final BigDecimal multiplier;

    SeatCategory(BigDecimal multiplier) {
        this.multiplier = multiplier;
    }

    public BigDecimal getMultiplier() {
        return multiplier;
    }

    public BigDecimal priceFor(BigDecimal basePrice) {
        BigDecimal base = (basePrice == null) ? BigDecimal.ZERO : basePrice;
        return base.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    public static SeatCategory fromString(String value) {
        if (value == null) return NORMAL;
        try {
            return SeatCategory.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return NORMAL;
        }
    }
}
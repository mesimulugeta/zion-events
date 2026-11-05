package com.ticketing.TicketingSystemSpringUI.domain;

import java.math.BigDecimal;

public class SeatDto {
    private int id;
    private String section;
    private int row;
    private int number;
    private String category;
    private BigDecimal price;

    public SeatDto(int id, String section, int row, int number, String category, BigDecimal price) {
        this.id = id;
        this.section = section;
        this.row = row;
        this.number = number;
        this.category = category;
        this.price = price;
    }

    public int getId() { return id; }
    public String getSection() { return section; }
    public int getRow() { return row; }
    public int getNumber() { return number; }
    public String getCategory() { return category; }
    public BigDecimal getPrice() { return price; }
}
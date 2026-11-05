package com.ticketing.TicketingSystemSpringUI.domain;

public class Seat {
    private int id;
    private String section;
    private int row;
    private int number;
    private SeatCategory category;

    public Seat(int id, String section, int row, int number) {
        this(id, section, row, number, SeatCategory.NORMAL);
    }

    public Seat(int id, String section, int row, int number, SeatCategory category) {
        this.id = id;
        this.section = section;
        this.row = row;
        this.number = number;
        this.category = category;
    }

    public int getId() { return id; }
    public String getSection() { return section; }
    public int getRow() { return row; }
    public int getNumber() { return number; }
    public SeatCategory getCategory() { return category; }
    public void setCategory(SeatCategory category) { this.category = category; }
}
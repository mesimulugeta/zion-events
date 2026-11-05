package com.ticketing.TicketingSystemSpringUI.domain;

public class Venue {
    private long id;
    private String name;
    private String address;

    public Venue(long id, String name, String address) {
        this.id = id;
        this.name = name;
        this.address = address;
    }

    public long getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
}
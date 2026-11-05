package com.ticketing.TicketingSystemSpringUI.domain;

public class ReservationSeat {

    private long reservationId;
    private int seatId;

    public ReservationSeat(long reservationId, int seatId) {
        this.reservationId = reservationId;
        this.seatId = seatId;
    }

    public long getReservationId() {
        return reservationId;
    }

    public int getSeatId() {
        return seatId;
    }
}
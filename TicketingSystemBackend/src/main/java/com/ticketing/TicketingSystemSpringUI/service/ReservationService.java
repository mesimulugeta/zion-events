package com.ticketing.TicketingSystemSpringUI.service;

import com.ticketing.TicketingSystemSpringUI.domain.Event;
import com.ticketing.TicketingSystemSpringUI.domain.Reservation;
import com.ticketing.TicketingSystemSpringUI.domain.ReservationStatus;
import com.ticketing.TicketingSystemSpringUI.domain.Seat;
import com.ticketing.TicketingSystemSpringUI.domain.SeatCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.*;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    public ReservationService(JdbcTemplate jdbcTemplate, EmailService emailService) {
        this.jdbcTemplate = jdbcTemplate;
        this.emailService = emailService;
    }

    public boolean isSeatAvailable(long eventId, int seatId) {
        String sql = "SELECT COUNT(*) FROM reservation_seats rs " +
                "JOIN reservations r ON rs.reservation_id = r.id " +
                "WHERE r.event_id = ? AND r.status IN ('HOLD','CONFIRMED') AND rs.seat_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, eventId, seatId);
        return count == 0;
    }

    @Transactional
    public long createHold(List<Integer> seatIds, long eventId, String customerEmail,
                           BigDecimal amount, Map<Integer, BigDecimal> seatPrices) {
        List<Integer> unavailableSeats = new ArrayList<>();
        for (int seatId : seatIds) {
            if (!isSeatAvailable(eventId, seatId)) {
                unavailableSeats.add(seatId);
            }
        }
        if (!unavailableSeats.isEmpty()) {
            throw new IllegalStateException("These seats are already reserved: " + unavailableSeats);
        }

        String insertReservation = "INSERT INTO reservations (event_id, customer_email, status, hold_expires_at, amount) VALUES (?, ?, ?, ?, ?)";
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(insertReservation, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, eventId);
            ps.setString(2, customerEmail);
            ps.setString(3, ReservationStatus.HOLD.name());
            ZonedDateTime expires = ZonedDateTime.now(ZoneId.systemDefault()).plusMinutes(5);
            ps.setTimestamp(4, Timestamp.from(expires.toInstant()));
            ps.setBigDecimal(5, amount);
            return ps;
        }, keyHolder);
        long reservationId = keyHolder.getKey().longValue();

        String insertSeat = "INSERT INTO reservation_seats (reservation_id, event_id, seat_id, price) VALUES (?, ?, ?, ?)";
        jdbcTemplate.batchUpdate(insertSeat, seatIds, seatIds.size(), (ps, seatId) -> {
            ps.setLong(1, reservationId);
            ps.setLong(2, eventId);
            ps.setInt(3, seatId);
            BigDecimal price = (seatPrices != null && seatPrices.get(seatId) != null)
                    ? seatPrices.get(seatId)
                    : BigDecimal.ZERO;
            ps.setBigDecimal(4, price);
        });
        return reservationId;
    }

    @Transactional
    public void confirmReservation(long reservationId) {
        log.info("🔍 confirmReservation called for reservation {}", reservationId);

        Reservation reservation = getReservationById(reservationId);
        Event event = getEventForReservation(reservationId);
        List<Seat> seats = getSeatsForReservation(reservationId);
        String customerEmail = reservation.getCustomerEmail();

        String sql = "UPDATE reservations SET status = ? WHERE id = ?";
        int updated = jdbcTemplate.update(sql, ReservationStatus.CONFIRMED.name(), reservationId);
        if (updated == 0) {
            throw new IllegalStateException("Reservation not found or already confirmed");
        }

        updatePaymentStatus(reservationId, "PAID");

        try {
            String userName = getUserNameByEmail(customerEmail);
            int total = seats.size();
            log.info("📧 About to send {} ticket email(s) for reservation {} to {}", total, reservationId, customerEmail);

            if (total == 0) {
                log.warn("⚠️ No seats found for reservation {} — no ticket emails to send!", reservationId);
            }

            for (int i = 0; i < total; i++) {
                Seat seat = seats.get(i);
                log.info("   -> sending ticket {} of {} for seat {}", i + 1, total, seat.getId());
                emailService.sendEventTicket(customerEmail, userName, event, seat,
                        String.valueOf(reservationId), i + 1, total);
            }
            log.info(" Finished sending {} ticket email(s) for reservation {}", total, reservationId);
        } catch (Exception e) {
            log.error(" Failed to send ticket email(s) for reservation {}: {}", reservationId, e.getMessage(), e);
        }
    }

    @Transactional
    public void cancelReservation(long reservationId, boolean cancelledByAdmin) {
        String deleteSeatsSql = "DELETE FROM reservation_seats WHERE reservation_id = ?";
        jdbcTemplate.update(deleteSeatsSql, reservationId);

        String sql = "UPDATE reservations SET status = ? WHERE id = ?";
        jdbcTemplate.update(sql, ReservationStatus.CANCELLED.name(), reservationId);

        Reservation reservation = getReservationById(reservationId);
        Event event = getEventForReservation(reservationId);
        String customerEmail = reservation.getCustomerEmail();
        try {
            String userName = getUserNameByEmail(customerEmail);
            emailService.sendReservationCancellation(customerEmail, userName, event, String.valueOf(reservationId), cancelledByAdmin);
            log.info("Cancellation email sent for reservation {}", reservationId);
        } catch (Exception e) {
            log.error("Failed to send cancellation email for reservation {}: {}", reservationId, e.getMessage(), e);
        }
    }

    @Transactional
    public void adminCancelReservation(long reservationId) {
        cancelReservation(reservationId, true);
    }

    public void updatePaymentStatus(long reservationId, String status) {
        String sql = "UPDATE reservations SET payment_status = ? WHERE id = ?";
        jdbcTemplate.update(sql, status, reservationId);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredHolds() {
        String deleteSeatsSql = "DELETE rs FROM reservation_seats rs " +
                "JOIN reservations r ON rs.reservation_id = r.id " +
                "WHERE r.status = 'HOLD' AND r.hold_expires_at < NOW()";
        int deletedSeats = jdbcTemplate.update(deleteSeatsSql);
        if (deletedSeats > 0) {
            log.info("Deleted {} seat links for expired holds", deletedSeats);
        }

        String updateSql = "UPDATE reservations SET status = 'CANCELLED' WHERE status = 'HOLD' AND hold_expires_at < NOW()";
        int updated = jdbcTemplate.update(updateSql);
        if (updated > 0) {
            log.info("Released {} expired hold reservations", updated);
        }
    }

    public Event getEventById(long eventId) {
        String sql = "SELECT e.id, e.venue_id, e.title, e.start_at, e.end_at, e.status, e.available_seats, e.venue_name, e.price " +
                     "FROM events e WHERE e.id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            Event event = new Event(
                rs.getLong("id"),
                rs.getLong("venue_id"),
                rs.getString("title"),
                rs.getTimestamp("start_at").toLocalDateTime(),
                rs.getTimestamp("end_at").toLocalDateTime(),
                rs.getString("status"),
                rs.getInt("available_seats")
            );
            event.setVenueName(rs.getString("venue_name"));
            event.setPrice(rs.getBigDecimal("price"));
            return event;
        }, eventId);
    }

    private String getUserNameByEmail(String email) {
        String sql = "SELECT username FROM users WHERE email = ?";
        try {
            return jdbcTemplate.queryForObject(sql, String.class, email);
        } catch (Exception e) {
            return email.split("@")[0];
        }
    }

    public Reservation getReservationById(long reservationId) {
        String sql = "SELECT id, event_id, customer_email, status, hold_expires_at, amount, payment_status FROM reservations WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            ZonedDateTime expires = rs.getTimestamp("hold_expires_at").toLocalDateTime().atZone(ZoneId.systemDefault());
            Reservation r = new Reservation(
                rs.getLong("id"),
                rs.getLong("event_id"),
                rs.getString("customer_email"),
                ReservationStatus.valueOf(rs.getString("status")),
                expires
            );
            r.setAmount(rs.getBigDecimal("amount"));
            r.setPaymentStatus(rs.getString("payment_status"));
            return r;
        }, reservationId);
    }

    public List<Seat> getSeatsForReservation(long reservationId) {
        String sql = "SELECT s.id, s.section, s.row_number, s.seat_number, s.category " +
                "FROM seats s JOIN reservation_seats rs ON s.id = rs.seat_id WHERE rs.reservation_id = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Seat(
                rs.getInt("id"),
                rs.getString("section"),
                rs.getInt("row_number"),
                rs.getInt("seat_number"),
                SeatCategory.fromString(rs.getString("category"))
        ), reservationId);
    }

    public Event getEventForReservation(long reservationId) {
        String sql = "SELECT e.id, e.venue_id, e.title, e.start_at, e.end_at, e.status, e.available_seats, e.venue_name, e.price " +
                     "FROM events e JOIN reservations r ON e.id = r.event_id WHERE r.id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            Event event = new Event(
                rs.getLong("id"),
                rs.getLong("venue_id"),
                rs.getString("title"),
                rs.getTimestamp("start_at").toLocalDateTime(),
                rs.getTimestamp("end_at").toLocalDateTime(),
                rs.getString("status"),
                rs.getInt("available_seats")
            );
            event.setVenueName(rs.getString("venue_name"));
            event.setPrice(rs.getBigDecimal("price"));
            return event;
        }, reservationId);
    }

    public List<Long> fetchSeatIds(long eventId) {
        String sql = "SELECT id FROM seats WHERE venue_id = (SELECT venue_id FROM events WHERE id = ?)";
        return jdbcTemplate.queryForList(sql, Long.class, eventId);
    }

    public List<Reservation> getReservationsByCustomer(String customerEmail) {
        String sql = "SELECT id, event_id, customer_email, status, hold_expires_at, amount, payment_status FROM reservations WHERE customer_email = ? ORDER BY id DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ZonedDateTime expires = rs.getTimestamp("hold_expires_at").toLocalDateTime().atZone(ZoneId.systemDefault());
            Reservation r = new Reservation(
                rs.getLong("id"),
                rs.getLong("event_id"),
                rs.getString("customer_email"),
                ReservationStatus.valueOf(rs.getString("status")),
                expires
            );
            r.setAmount(rs.getBigDecimal("amount"));
            r.setPaymentStatus(rs.getString("payment_status"));
            return r;
        }, customerEmail);
    }

    public List<Reservation> getAllReservations() {
        String sql = "SELECT id, event_id, customer_email, status, hold_expires_at, amount, payment_status FROM reservations ORDER BY id DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ZonedDateTime expires = rs.getTimestamp("hold_expires_at").toLocalDateTime().atZone(ZoneId.systemDefault());
            Reservation r = new Reservation(
                rs.getLong("id"),
                rs.getLong("event_id"),
                rs.getString("customer_email"),
                ReservationStatus.valueOf(rs.getString("status")),
                expires
            );
            r.setAmount(rs.getBigDecimal("amount"));
            r.setPaymentStatus(rs.getString("payment_status"));
            return r;
        });
    }

    public Page<Reservation> getReservationsPage(Pageable pageable) {
        String countSql = "SELECT COUNT(*) FROM reservations";
        long total = jdbcTemplate.queryForObject(countSql, Long.class);

        Map<String, String> sortable = Map.of(
                "id", "id",
                "customerEmail", "customer_email",
                "holdExpiresAt", "hold_expires_at",
                "paymentStatus", "payment_status",
                "status", "status",
                "amount", "amount"
        );

        StringBuilder orderClause = new StringBuilder();
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                String column = sortable.get(order.getProperty());
                if (column == null) continue;
                orderClause.append(orderClause.length() == 0 ? "ORDER BY " : ", ")
                           .append(column).append(" ")
                           .append(order.isAscending() ? "ASC" : "DESC");
            }
        }
        if (orderClause.length() == 0) {
            orderClause.append("ORDER BY id ASC");
        }

        String sql = "SELECT id, event_id, customer_email, status, hold_expires_at, amount, payment_status " +
                     "FROM reservations " + orderClause + " LIMIT ? OFFSET ?";

        List<Reservation> reservations = jdbcTemplate.query(sql, (rs, rowNum) -> {
            ZonedDateTime expires = rs.getTimestamp("hold_expires_at")
                    .toLocalDateTime().atZone(ZoneId.systemDefault());
            Reservation r = new Reservation(
                rs.getLong("id"),
                rs.getLong("event_id"),
                rs.getString("customer_email"),
                ReservationStatus.valueOf(rs.getString("status")),
                expires
            );
            r.setAmount(rs.getBigDecimal("amount"));
            r.setPaymentStatus(rs.getString("payment_status"));
            return r;
        }, pageable.getPageSize(), pageable.getOffset());

        return new PageImpl<>(reservations, pageable, total);
    }
}
package com.ticketing.TicketingSystemSpringUI.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;

import com.ticketing.TicketingSystemSpringUI.domain.Event;
import com.ticketing.TicketingSystemSpringUI.domain.SeatCategory;
import com.ticketing.TicketingSystemSpringUI.domain.SeatDto;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final JdbcTemplate jdbcTemplate;

    public EventService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private List<Event> deduplicate(List<Event> events) {
        return events.stream()
                .collect(Collectors.toMap(
                        e -> e.getTitle().toLowerCase(),
                        e -> e,
                        (a, b) -> a,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .toList();
    }

    public long addEvent(long venueId,
                         String title,
                         LocalDateTime start,
                         LocalDateTime end,
                         String status,
                         int availableSeats,
                         String category,
                         String imageUrl,
                         String venueName,
                         String description,
                         BigDecimal price,
                         BigDecimal normalPrice,
                         BigDecimal vipPrice,
                         BigDecimal vvipPrice) {

        String sql = "INSERT INTO events " +
                "(venue_id, title, start_at, end_at, status, available_seats, category, image_url, venue_name, description, price, normal_price, vip_price, vvip_price) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, venueId);
            ps.setString(2, title);
            ps.setTimestamp(3, Timestamp.valueOf(start));
            ps.setTimestamp(4, Timestamp.valueOf(end));
            ps.setString(5, status);
            ps.setInt(6, availableSeats);
            ps.setString(7, category);
            ps.setString(8, imageUrl);
            ps.setString(9, venueName);
            ps.setString(10, description);
            ps.setBigDecimal(11, price);
            ps.setBigDecimal(12, normalPrice);
            ps.setBigDecimal(13, vipPrice);
            ps.setBigDecimal(14, vvipPrice);
            return ps;
        }, keyHolder);

        return keyHolder.getKey().longValue();
    }

    public long addEvent(long venueId, String title, LocalDateTime start, LocalDateTime end,
                         String status, int availableSeats, String category, String imageUrl,
                         String venueName, String description, BigDecimal price) {
        return addEvent(venueId, title, start, end, status, availableSeats, category, imageUrl,
                venueName, description, price, price, null, null);
    }

    public long addEvent(long venueId, String title, LocalDateTime start, LocalDateTime end,
                         String status, int availableSeats, String category, String imageUrl,
                         String venueName, String description) {
        return addEvent(venueId, title, start, end, status, availableSeats, category, imageUrl,
                venueName, description, BigDecimal.ZERO, BigDecimal.ZERO, null, null);
    }

    public long addEvent(long venueId, String title, LocalDateTime start, LocalDateTime end,
                         String status, int availableSeats) {
        return addEvent(venueId, title, start, end, status, availableSeats, "OTHER", null, null, null, BigDecimal.ZERO, BigDecimal.ZERO, null, null);
    }

    public List<Event> getAllEvents() {
        String sql = "SELECT e.id, e.venue_id, e.title, e.start_at, e.end_at, e.status, e.available_seats, " +
                "e.category, e.image_url, e.venue_name, e.description, e.price, e.normal_price, e.vip_price, e.vvip_price, " +
                "v.name AS venue_name_from_venue " +
                "FROM events e LEFT JOIN venues v ON e.venue_id = v.id";

        List<Event> events = jdbcTemplate.query(sql, (rs, rowNum) -> {
            long eventId = rs.getLong("id");
            long venueId = rs.getLong("venue_id");
            int actuallyAvailable = calculateAvailableSeats(eventId, venueId);
            String venueName = rs.getString("venue_name");
            if (venueName == null || venueName.isEmpty()) {
                venueName = rs.getString("venue_name_from_venue");
            }
            Event event = new Event(
                    eventId,
                    venueId,
                    rs.getString("title"),
                    rs.getTimestamp("start_at").toLocalDateTime(),
                    rs.getTimestamp("end_at").toLocalDateTime(),
                    rs.getString("status"),
                    actuallyAvailable,
                    null,
                    rs.getString("category"),
                    rs.getString("image_url"),
                    venueName,
                    rs.getString("description")
            );
            event.setPrice(rs.getBigDecimal("price"));
            event.setNormalPrice(rs.getBigDecimal("normal_price"));
            event.setVipPrice(rs.getBigDecimal("vip_price"));
            event.setVvipPrice(rs.getBigDecimal("vvip_price"));
            return event;
        });
        return deduplicate(events);
    }

    public Event getEventById(long eventId) {
        String sql = "SELECT e.id, e.venue_id, e.title, e.start_at, e.end_at, e.status, e.available_seats, " +
                "e.category, e.image_url, e.venue_name, e.description, e.price, e.normal_price, e.vip_price, e.vvip_price, " +
                "v.name AS venue_name_from_venue " +
                "FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE e.id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            long venueId = rs.getLong("venue_id");
            int available = calculateAvailableSeats(eventId, venueId);
            String venueName = rs.getString("venue_name");
            if (venueName == null || venueName.isEmpty()) {
                venueName = rs.getString("venue_name_from_venue");
            }
            Event event = new Event(
                    eventId,
                    venueId,
                    rs.getString("title"),
                    rs.getTimestamp("start_at").toLocalDateTime(),
                    rs.getTimestamp("end_at").toLocalDateTime(),
                    rs.getString("status"),
                    available,
                    null,
                    rs.getString("category"),
                    rs.getString("image_url"),
                    venueName,
                    rs.getString("description")
            );
            event.setPrice(rs.getBigDecimal("price"));
            event.setNormalPrice(rs.getBigDecimal("normal_price"));
            event.setVipPrice(rs.getBigDecimal("vip_price"));
            event.setVvipPrice(rs.getBigDecimal("vvip_price"));
            return event;
        }, eventId);
    }

    public List<Event> getEventsByCategory(String category) {
        String sql = "SELECT e.id, e.venue_id, e.title, e.start_at, e.end_at, e.status, e.available_seats, " +
                "e.category, e.image_url, e.venue_name, e.description, e.price, e.normal_price, e.vip_price, e.vvip_price, " +
                "v.name AS venue_name_from_venue " +
                "FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE e.category = ?";

        List<Event> events = jdbcTemplate.query(sql, (rs, rowNum) -> {
            long eventId = rs.getLong("id");
            long venueId = rs.getLong("venue_id");
            int available = calculateAvailableSeats(eventId, venueId);
            String venueName = rs.getString("venue_name");
            if (venueName == null || venueName.isEmpty()) {
                venueName = rs.getString("venue_name_from_venue");
            }
            Event event = new Event(
                    eventId,
                    venueId,
                    rs.getString("title"),
                    rs.getTimestamp("start_at").toLocalDateTime(),
                    rs.getTimestamp("end_at").toLocalDateTime(),
                    rs.getString("status"),
                    available,
                    null,
                    rs.getString("category"),
                    rs.getString("image_url"),
                    venueName,
                    rs.getString("description")
            );
            event.setPrice(rs.getBigDecimal("price"));
            event.setNormalPrice(rs.getBigDecimal("normal_price"));
            event.setVipPrice(rs.getBigDecimal("vip_price"));
            event.setVvipPrice(rs.getBigDecimal("vvip_price"));
            return event;
        }, category);
        return deduplicate(events);
    }

    public List<Event> searchEventsByTitle(String keyword) {
        String sql = "SELECT e.id, e.venue_id, e.title, e.start_at, e.end_at, e.status, e.available_seats, " +
                "e.category, e.image_url, e.venue_name, e.description, e.price, e.normal_price, e.vip_price, e.vvip_price, " +
                "v.name AS venue_name_from_venue " +
                "FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE LOWER(e.title) LIKE LOWER(?)";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            long eventId = rs.getLong("id");
            long venueId = rs.getLong("venue_id");
            int available = calculateAvailableSeats(eventId, venueId);
            String venueName = rs.getString("venue_name");
            if (venueName == null || venueName.isEmpty()) {
                venueName = rs.getString("venue_name_from_venue");
            }
            Event event = new Event(
                    eventId,
                    venueId,
                    rs.getString("title"),
                    rs.getTimestamp("start_at").toLocalDateTime(),
                    rs.getTimestamp("end_at").toLocalDateTime(),
                    rs.getString("status"),
                    available,
                    null,
                    rs.getString("category"),
                    rs.getString("image_url"),
                    venueName,
                    rs.getString("description")
            );
            event.setPrice(rs.getBigDecimal("price"));
            event.setNormalPrice(rs.getBigDecimal("normal_price"));
            event.setVipPrice(rs.getBigDecimal("vip_price"));
            event.setVvipPrice(rs.getBigDecimal("vvip_price"));
            return event;
        }, "%" + keyword + "%");
    }

    public boolean updateEvent(long id,
                               String title,
                               LocalDateTime startAt,
                               LocalDateTime endAt,
                               String status,
                               int availableSeats,
                               String category,
                               String imageUrl,
                               String venueName,
                               String description,
                               BigDecimal price,
                               BigDecimal normalPrice,
                               BigDecimal vipPrice,
                               BigDecimal vvipPrice) {
        String sql = "UPDATE events SET title = ?, start_at = ?, end_at = ?, status = ?, " +
                "available_seats = ?, category = ?, image_url = ?, venue_name = ?, description = ?, " +
                "price = ?, normal_price = ?, vip_price = ?, vvip_price = ? " +
                "WHERE id = ?";
        return jdbcTemplate.update(
                sql,
                title,
                Timestamp.valueOf(startAt),
                Timestamp.valueOf(endAt),
                status,
                availableSeats,
                category,
                imageUrl,
                venueName,
                description,
                price,
                normalPrice,
                vipPrice,
                vvipPrice,
                id
        ) > 0;
    }

    public boolean updateEvent(long id, String title, LocalDateTime startAt, LocalDateTime endAt,
                               String status, int availableSeats, String category, String imageUrl,
                               String venueName, String description, BigDecimal price) {
        return updateEvent(id, title, startAt, endAt, status, availableSeats, category, imageUrl, venueName, description, price, price, null, null);
    }

    public boolean updateEvent(long id, String title, LocalDateTime startAt, LocalDateTime endAt,
                               String status, int availableSeats, String category, String imageUrl,
                               String venueName, String description) {
        String sql = "UPDATE events SET title = ?, start_at = ?, end_at = ?, status = ?, " +
                "available_seats = ?, category = ?, image_url = ?, venue_name = ?, description = ? " +
                "WHERE id = ?";
        return jdbcTemplate.update(
                sql, title, Timestamp.valueOf(startAt), Timestamp.valueOf(endAt), status,
                availableSeats, category, imageUrl, venueName, description, id
        ) > 0;
    }

    public boolean updateEvent(long id, String title, LocalDateTime startAt, LocalDateTime endAt,
                               String status, int availableSeats) {
        return updateEvent(id, title, startAt, endAt, status, availableSeats, null, null, null, null);
    }

    public boolean cancelEvent(long eventId) {
        String sql = "UPDATE events SET status = 'CANCELLED' WHERE id = ?";
        return jdbcTemplate.update(sql, eventId) > 0;
    }

    public void updateEventImage(long eventId, String imageUrl) {
        String sql = "UPDATE events SET image_url = ? WHERE id = ?";
        jdbcTemplate.update(sql, imageUrl, eventId);
    }

    public List<Long> getAvailableSeatIdsForEvent(long eventId) {
        String venueSql = "SELECT venue_id FROM events WHERE id = ?";
        List<Long> venueIds = jdbcTemplate.queryForList(venueSql, Long.class, eventId);
        if (venueIds.isEmpty()) return new ArrayList<>();
        Long venueId = venueIds.get(0);
        String allSeatsSql = "SELECT id FROM seats WHERE venue_id = ?";
        List<Long> allSeats = jdbcTemplate.queryForList(allSeatsSql, Long.class, venueId);
        if (allSeats.isEmpty()) return new ArrayList<>();
        String reservedSql = "SELECT rs.seat_id FROM reservation_seats rs " +
                "JOIN reservations r ON rs.reservation_id = r.id " +
                "WHERE r.event_id = ? AND r.status IN ('HOLD', 'CONFIRMED')";
        List<Long> reservedSeats = jdbcTemplate.queryForList(reservedSql, Long.class, eventId);
        List<Long> available = new ArrayList<>(allSeats);
        available.removeAll(reservedSeats);
        return available;
    }

    private int calculateAvailableSeats(long eventId, long venueId) {
        Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM seats WHERE venue_id = ?", Integer.class, venueId);
        Integer reserved = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM reservations r JOIN reservation_seats rs ON r.id = rs.reservation_id " +
                "WHERE r.event_id = ? AND r.status IN ('HOLD', 'CONFIRMED')", Integer.class, eventId);
        int totalSeats = (total == null) ? 0 : total;
        int reservedSeats = (reserved == null) ? 0 : reserved;
        return totalSeats - reservedSeats;
    }

    public List<Long> fetchSeatIds(long venueId) {
        String sql = "SELECT id FROM seats WHERE venue_id = ?";
        return jdbcTemplate.queryForList(sql, Long.class, venueId);
    }

    public List<com.ticketing.TicketingSystemSpringUI.domain.Venue> getAllVenues() {
        String sql = "SELECT id, name, address FROM venues";
        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new com.ticketing.TicketingSystemSpringUI.domain.Venue(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("address")
                )
        );
    }

    public List<SeatDto> getAvailableSeatsForEvent(long eventId) {
        Event event = getEventById(eventId);
        long venueId = event.getVenueId();
        BigDecimal basePrice = event.getPrice();

        String allSeatsSql = "SELECT id, section, row_number, seat_number, category " +
                "FROM seats WHERE venue_id = ? ORDER BY section, row_number, seat_number";

        List<SeatDto> allSeats = jdbcTemplate.query(allSeatsSql, (rs, rowNum) -> {
            SeatCategory cat = SeatCategory.fromString(rs.getString("category"));
            
            BigDecimal price = basePrice;
            if (cat == SeatCategory.VVIP && event.getVvipPrice() != null) {
                price = event.getVvipPrice();
            } else if (cat == SeatCategory.VIP && event.getVipPrice() != null) {
                price = event.getVipPrice();
            } else if (cat == SeatCategory.NORMAL && event.getNormalPrice() != null) {
                price = event.getNormalPrice();
            } else {
                price = cat.priceFor(basePrice);
            }

            return new SeatDto(
                    rs.getInt("id"),
                    rs.getString("section"),
                    rs.getInt("row_number"),
                    rs.getInt("seat_number"),
                    cat.name(),
                    price
            );
        }, venueId);

        String reservedSql = "SELECT rs.seat_id FROM reservation_seats rs " +
                "JOIN reservations r ON rs.reservation_id = r.id " +
                "WHERE r.event_id = ? AND r.status IN ('HOLD','CONFIRMED')";
        List<Integer> reservedIds = jdbcTemplate.queryForList(reservedSql, Integer.class, eventId);

        return allSeats.stream()
                .filter(s -> !reservedIds.contains(s.getId()))
                .toList();
    }

    public Map<Integer, SeatCategory> getSeatCategories(List<Integer> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) return Map.of();

        String placeholders = seatIds.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = "SELECT id, category FROM seats WHERE id IN (" + placeholders + ")";

        Map<Integer, SeatCategory> result = new HashMap<>();
        jdbcTemplate.query(sql, (ResultSet rs) -> {
            result.put(rs.getInt("id"), SeatCategory.fromString(rs.getString("category")));
        }, seatIds.toArray());
        return result;
    }
}
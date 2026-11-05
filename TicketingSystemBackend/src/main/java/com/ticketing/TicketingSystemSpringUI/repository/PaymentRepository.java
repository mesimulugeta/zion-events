package com.ticketing.TicketingSystemSpringUI.repository;

import com.ticketing.TicketingSystemSpringUI.domain.Payment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PaymentRepository {

    private final JdbcTemplate jdbc;

    public PaymentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Payment payment) {
        String sql = "INSERT INTO payments (reservation_id, tx_ref, amount, currency, status, chapa_status, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
        jdbc.update(sql,
                payment.getReservationId(),
                payment.getTxRef(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getChapaStatus()
        );
    }

    public void update(Payment payment) {
        String sql = "UPDATE payments SET status = ?, chapa_status = ?, updated_at = NOW() WHERE tx_ref = ?";
        jdbc.update(sql,
                payment.getStatus(),
                payment.getChapaStatus(),
                payment.getTxRef()
        );
    }

    public Payment findByTxRef(String txRef) {
        String sql = "SELECT id, reservation_id, tx_ref, amount, currency, status, chapa_status, created_at, updated_at " +
                     "FROM payments WHERE tx_ref = ?";
        return jdbc.queryForObject(sql, (rs, rowNum) -> {
            Payment p = new Payment();
            p.setId(rs.getLong("id"));
            p.setReservationId(rs.getLong("reservation_id"));
            p.setTxRef(rs.getString("tx_ref"));
            p.setAmount(rs.getBigDecimal("amount"));
            p.setCurrency(rs.getString("currency"));
            p.setStatus(rs.getString("status"));
            p.setChapaStatus(rs.getString("chapa_status"));
            p.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            p.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
            return p;
        }, txRef);
    }
}
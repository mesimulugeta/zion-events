package com.ticketing.TicketingSystemSpringUI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TicketingSystemSpringUi {

    public static void main(String[] args) {
        SpringApplication.run(TicketingSystemSpringUi.class, args);
    }

}

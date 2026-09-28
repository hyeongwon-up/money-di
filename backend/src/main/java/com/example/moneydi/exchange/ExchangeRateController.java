package com.example.moneydi.exchange;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/exchange-rates")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ExchangeRateController {
    private final ExchangeRateService service;
    @GetMapping public List<ExchangeRate> list() { return service.list(); }
}

package com.example.moneydi.point;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PointController {
    private final PointService pointService;

    @GetMapping
    public List<Point> getAllPoints() {
        return pointService.getAllPoints();
    }

    @GetMapping("/{owner}")
    public Point getPoint(@PathVariable String owner) {
        return pointService.getPointByOwner(owner);
    }

    @GetMapping("/{owner}/history")
    public List<PointHistory> getHistory(@PathVariable String owner) {
        return pointService.getHistoryByOwner(owner);
    }

    @PostMapping("/{owner}/add")
    public Point addPoints(@PathVariable String owner, @RequestBody PointRequest request) {
        return pointService.addPoints(owner, request.getAmount(), request.getDescription());
    }

    @PostMapping("/{owner}/use")
    public Point usePoints(@PathVariable String owner, @RequestBody PointRequest request) {
        return pointService.usePoints(owner, request.getAmount(), request.getDescription());
    }

    @Data
    public static class PointRequest {
        private Long amount;
        private String description;
    }
}

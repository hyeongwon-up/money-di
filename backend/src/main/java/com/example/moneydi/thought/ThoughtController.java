package com.example.moneydi.thought;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/thoughts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ThoughtController {

    private final ThoughtService thoughtService;

    // 최상위 노드 조회 (자식들까지 포함해서 반환됨)
    @GetMapping
    public List<ThoughtResponseDto> getAllThoughts() {
        return thoughtService.getAllThoughts();
    }

    // 새로운 생각 작성 (parentId가 있으면 해당 생각의 자식으로 추가)
    @PostMapping
    public ThoughtResponseDto createThought(@RequestBody ThoughtRequestDto request) {
        return thoughtService.createThought(request);
    }

    // 생각 수정
    @PutMapping("/{id}")
    public ThoughtResponseDto updateThought(@PathVariable Long id, @RequestBody ThoughtRequestDto request) {
        return thoughtService.updateThought(id, request);
    }

    // 생각 삭제 (하위 생각까지 모두 삭제됨 - CascadeType.ALL)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteThought(@PathVariable Long id) {
        try {
            thoughtService.deleteThought(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

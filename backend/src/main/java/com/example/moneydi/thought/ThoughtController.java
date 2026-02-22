package com.example.moneydi.thought;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/thoughts")
@CrossOrigin(origins = "*")
public class ThoughtController {

    private final ThoughtRepository thoughtRepository;

    public ThoughtController(ThoughtRepository thoughtRepository) {
        this.thoughtRepository = thoughtRepository;
    }

    // 최상위 노드 조회 (자식들까지 포함해서 반환됨)
    @GetMapping
    public List<ThoughtResponseDto> getAllThoughts() {
        return thoughtRepository.findByParentThoughtIsNullOrderByCreatedAtDesc().stream()
                .map(ThoughtResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 새로운 생각 작성 (parentId가 있으면 해당 생각의 자식으로 추가)
    @PostMapping
    public ThoughtResponseDto createThought(@RequestBody ThoughtRequestDto request) {
        Thought thought = new Thought();
        thought.setContent(request.getContent());

        if (request.getParentId() != null) {
            Thought parent = thoughtRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent thought not found"));
            parent.addSubThought(thought);
            // JPA cascade를 설정했거나 양방향 매핑을 했더라도,
            // 부모 엔티티 관리가 유리하지만 직관적으로 자식도 명시적 저장
        }

        Thought savedThought = thoughtRepository.save(thought);
        return ThoughtResponseDto.fromEntity(savedThought);
    }

    // 생각 수정
    @PutMapping("/{id}")
    public ThoughtResponseDto updateThought(@PathVariable Long id, @RequestBody ThoughtRequestDto request) {
        Thought thought = thoughtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Thought not found"));
        thought.setContent(request.getContent());
        Thought updatedThought = thoughtRepository.save(thought);
        return ThoughtResponseDto.fromEntity(updatedThought);
    }

    // 생각 삭제 (하위 생각까지 모두 삭제됨 - CascadeType.ALL)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteThought(@PathVariable Long id) {
        if (!thoughtRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        thoughtRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

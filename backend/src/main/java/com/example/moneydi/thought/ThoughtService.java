package com.example.moneydi.thought;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ThoughtService {

    private final ThoughtRepository thoughtRepository;

    @Transactional(readOnly = true)
    public List<ThoughtResponseDto> getAllThoughts() {
        return thoughtRepository.findByParentThoughtIsNullOrderByCreatedAtDesc().stream()
                .map(ThoughtResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ThoughtResponseDto createThought(ThoughtRequestDto request) {
        Thought thought = new Thought();
        thought.setContent(request.getContent());

        if (request.getParentId() != null) {
            Thought parent = thoughtRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent thought not found"));
            parent.addSubThought(thought);
        }

        Thought savedThought = thoughtRepository.save(thought);
        return ThoughtResponseDto.fromEntity(savedThought);
    }

    public ThoughtResponseDto updateThought(Long id, ThoughtRequestDto request) {
        Thought thought = thoughtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Thought not found"));
        thought.setContent(request.getContent());
        Thought updatedThought = thoughtRepository.save(thought);
        return ThoughtResponseDto.fromEntity(updatedThought);
    }

    public void deleteThought(Long id) {
        if (!thoughtRepository.existsById(id)) {
            throw new IllegalArgumentException("Thought not found");
        }
        thoughtRepository.deleteById(id);
    }
}

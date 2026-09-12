package com.example.moneydi.thought;

import lombok.RequiredArgsConstructor;
import com.example.moneydi.common.InputChecks;
import com.example.moneydi.common.ResourceNotFoundException;
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
        thought.setContent(InputChecks.requiredText(request.getContent(), "생각 내용", 2000));

        if (request.getParentId() != null) {
            Thought parent = thoughtRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("답글을 달 생각이 삭제되었습니다. 목록을 새로고침해주세요."));
            parent.addSubThought(thought);
        }

        Thought savedThought = thoughtRepository.save(thought);
        return ThoughtResponseDto.fromEntity(savedThought);
    }

    public ThoughtResponseDto updateThought(Long id, ThoughtRequestDto request) {
        Thought thought = thoughtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("생각을 찾을 수 없습니다. 목록을 새로고침해주세요."));
        thought.setContent(InputChecks.requiredText(request.getContent(), "생각 내용", 2000));
        Thought updatedThought = thoughtRepository.save(thought);
        return ThoughtResponseDto.fromEntity(updatedThought);
    }

    public void deleteThought(Long id) {
        if (!thoughtRepository.existsById(id)) {
            throw new ResourceNotFoundException("생각을 찾을 수 없습니다. 목록을 새로고침해주세요.");
        }
        thoughtRepository.deleteById(id);
    }
}

package com.example.moneydi.thought;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ThoughtResponseDto {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private Long parentId;
    private List<ThoughtResponseDto> subThoughts;

    public static ThoughtResponseDto fromEntity(Thought thought) {
        ThoughtResponseDto dto = new ThoughtResponseDto();
        dto.setId(thought.getId());
        dto.setContent(thought.getContent());
        dto.setCreatedAt(thought.getCreatedAt());
        if (thought.getParentThought() != null) {
            dto.setParentId(thought.getParentThought().getId());
        }
        if (thought.getSubThoughts() != null) {
            dto.setSubThoughts(thought.getSubThoughts().stream()
                    .map(ThoughtResponseDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}

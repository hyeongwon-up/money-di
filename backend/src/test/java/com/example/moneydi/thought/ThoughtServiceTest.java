package com.example.moneydi.thought;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ThoughtServiceTest {

    @Mock
    private ThoughtRepository thoughtRepository;

    @InjectMocks
    private ThoughtService thoughtService;

    @Test
    @DisplayName("생각 생성 시 부모 ID가 있으면 부모의 자식으로 추가되어야 한다")
    void createThought_withParentId_shouldAddAsSubThought() {
        // given
        Long parentId = 1L;
        Thought parent = new Thought();
        parent.setId(parentId);
        parent.setContent("부모 생각");

        ThoughtRequestDto request = new ThoughtRequestDto();
        request.setContent("자식 생각");
        request.setParentId(parentId);

        when(thoughtRepository.findById(parentId)).thenReturn(Optional.of(parent));
        when(thoughtRepository.save(any(Thought.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ThoughtResponseDto response = thoughtService.createThought(request);

        // then
        assertThat(response.getContent()).isEqualTo("자식 생각");
        assertThat(parent.getSubThoughts()).hasSize(1);
        assertThat(parent.getSubThoughts().get(0).getContent()).isEqualTo("자식 생각");
        verify(thoughtRepository).save(any(Thought.class));
    }

    @Test
    @DisplayName("생각 수정 시 내용이 올바르게 변경되어야 한다")
    void updateThought_shouldChangeContent() {
        // given
        Long thoughtId = 1L;
        Thought existingThought = new Thought();
        existingThought.setId(thoughtId);
        existingThought.setContent("기존 내용");

        ThoughtRequestDto request = new ThoughtRequestDto();
        request.setContent("수정된 내용");

        when(thoughtRepository.findById(thoughtId)).thenReturn(Optional.of(existingThought));
        when(thoughtRepository.save(any(Thought.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ThoughtResponseDto response = thoughtService.updateThought(thoughtId, request);

        // then
        assertThat(response.getContent()).isEqualTo("수정된 내용");
    }
}

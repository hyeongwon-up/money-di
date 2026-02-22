package com.example.moneydi.thought;

import lombok.Data;

@Data
public class ThoughtRequestDto {
    private String content;
    private Long parentId;
}

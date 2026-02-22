package com.example.moneydi.thought;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Thought {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Thought parentThought;

    @OneToMany(mappedBy = "parentThought", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Thought> subThoughts = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    public void addSubThought(Thought subThought) {
        subThoughts.add(subThought);
        subThought.setParentThought(this);
    }
}

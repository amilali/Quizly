package com.quizly.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    private Long id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "stack_id")
    private Stack stack;

    public Topic() {}

    public Topic(Long id, String name, Stack stack) {
        this.id = id;
        this.name = name;
        this.stack = stack;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Stack getStack() {
        return stack;
    }

    public void setStack(Stack stack) {
        this.stack = stack;
    }
}

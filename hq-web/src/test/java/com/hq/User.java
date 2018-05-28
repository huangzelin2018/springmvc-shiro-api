package com.hq;

public class User {
    Long id;
    String order;
    String message;

    public User(Long id, String order, String message) {
        this.id = id;
        this.order = order;
        this.message = message;
    }

    public String getOrder() {
        return order;
    }

    public void setOrder(String order) {
        this.order = order;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}

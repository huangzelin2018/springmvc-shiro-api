package com.hq;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Demo {
    public static void main(String[] args) {
        List<User> list = new ArrayList<User>();
        User user1 = new User(1L,"第一位","用户1");
        list.add(user1);
        User user2 = new User(2L,"第二位","用户2");
        list.add(user2);
        User user3 = new User(3L,"第三位","用户3");
        list.add(user3);
//        List<String> tableNames=list.stream().map(User::getMessage).collect(Collectors.toList());
//        System.out.println("输出第一个："+tableNames);
//        List<String> orders=list.stream().map(User::getOrder).collect(Collectors.toList());
//        System.out.println(orders);
        List<Long> ids = list.stream().map(User::getId).collect(Collectors.toList());
        System.out.println(ids);
    }

}

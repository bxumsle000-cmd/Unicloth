package com.EEIT25.unicloth.service;

import com.EEIT25.unicloth.dto.order.OrderItemResponse;
import com.EEIT25.unicloth.dto.order.OrderResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.MemberRepository;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final MemberRepository memberRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CurrentMember currentMember;

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders (){
        Member member = memberRepository.findById(currentMember.getCurrentId())
                .orElseThrow(() -> ApiException.unauthorized("登入過期或失效"));
        List<Order> orderList = orderRepository.findByMemberIdOrderByCreatedAtDesc(member.getId());

        List<OrderResponse> myOrders = orderList.stream().map(order -> {
            List<OrderItem>  orderItemList =  orderItemRepository.findByOrder(order);
            return OrderResponse.from(order,orderItemList);
        }).toList();

        return myOrders;
    }


}

package com.EEIT25.unicloth.service.shop;

import com.EEIT25.unicloth.dto.order.OrderResponse;
import com.EEIT25.unicloth.entity.Member;
import com.EEIT25.unicloth.entity.MemberCoupon;
import com.EEIT25.unicloth.entity.Order;
import com.EEIT25.unicloth.entity.OrderItem;
import com.EEIT25.unicloth.entity.Payment;
import com.EEIT25.unicloth.enums.OrderStatus;
import com.EEIT25.unicloth.enums.PaymentStatus;
import com.EEIT25.unicloth.exception.ApiException;
import com.EEIT25.unicloth.repository.OrderItemRepository;
import com.EEIT25.unicloth.repository.OrderRepository;
import com.EEIT25.unicloth.repository.PaymentRepository;
import com.EEIT25.unicloth.repository.ProductVariantRepository;
import com.EEIT25.unicloth.security.CurrentMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 訂單相關服務<br>
 * - {@link #getOrders()}：會員中心的「我的訂單」<br><br>
 * - {@link #cancelOrder(Long)}：取消未付款的訂單，把庫存、折價券還回去
 */
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PaymentRepository paymentRepository;
    private final CurrentMember currentMember;

    /** 我的訂單：登入會員的所有訂單，最新的排前面，每張帶訂單明細 */
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders (){
        Member member = currentMember.require();
        List<Order> orderList = orderRepository.findByMemberIdOrderByCreatedAtDesc(member.getId());

        List<OrderResponse> myOrders = orderList.stream().map(order -> {
            List<OrderItem>  orderItemList =  orderItemRepository.findByOrder(order);
            return OrderResponse.from(order,orderItemList);
        }).toList();

        return myOrders;
    }

    /**
     * 取消訂單：把結帳時扣掉的東西還回去。<br>
     * 給「綠界通知付款失敗」和「逾時未付款的排程」共用。<br>
     * 還原庫存、還原折價券、取消待付款紀錄都在同一個交易裡，任何一步失敗就全部還原。<br>
     * 購物車不還原：已結帳的項目不會再放回購物車。
     */
    @Transactional
    public void cancelOrder(Long orderId) {
        // 1. 鎖定訂單，避免「取消」和「綠界付款成功通知」同時處理同一張訂單
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> ApiException.notFound("找不到此訂單"));

        // 2. 已經取消過就不用再做一次（避免庫存被加回兩次）
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        // 3. 只有「未付款」的訂單可以取消
        if (order.getPaidAt() != null) {
            throw ApiException.conflict("此訂單已付款，不能直接取消");
        }
        if (order.getStatus() != OrderStatus.UNPAID) {
            throw ApiException.conflict("目前訂單狀態無法取消");
        }

        // 4. 庫存加回去
        //    商品被刪除時明細的 variant 會是 null，這種就沒有庫存可以還
        List<OrderItem> orderItemList = orderItemRepository.findByOrder(order);
        for (OrderItem orderItem : orderItemList) {
            if (orderItem.getVariant() != null) {
                productVariantRepository.restoreStock(orderItem.getVariant().getId(), orderItem.getQty());
            }
        }

        // 5. 折價券還回去：清掉使用時間和綁定的訂單，會員就能再用
        //    （券如果已經過期，還回去也不能用，結帳時會擋）
        MemberCoupon memberCoupon = order.getMemberCoupon();
        if (memberCoupon != null) {
            memberCoupon.setUsedAt(null);
            memberCoupon.setOrder(null);
        }

        // 6. 還在等待付款的付款紀錄一起改成取消
        List<Payment> pendingPaymentList = paymentRepository.findByOrderIdAndStatus(order.getId(), PaymentStatus.PENDING);
        for (Payment payment : pendingPaymentList) {
            payment.setStatus(PaymentStatus.CANCELLED);
        }

        // 7. 訂單改成已取消
        order.setStatus(OrderStatus.CANCELLED);
    }
}

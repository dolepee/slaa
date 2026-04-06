// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title MockHSP - Mock HashKey Settlement Protocol
/// @notice Simulates HSP Cart Mandate payment flow for testnet demo
/// @dev In production, this would be replaced by the real HSP gateway
contract MockHSP {
    using SafeERC20 for IERC20;

    enum OrderStatus { Created, Paid, Expired, Cancelled }

    struct CartMandate {
        string cartMandateId;
        address merchant;
        address payer;
        uint256 amount;
        address token;
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    mapping(string => CartMandate) public orders;
    string[] public orderIds;

    address public owner;
    IERC20 public usdc;

    event OrderCreated(string indexed cartMandateId, address indexed payer, uint256 amount);
    event PaymentSuccessful(string indexed cartMandateId, address indexed merchant, uint256 amount);
    event OrderExpired(string indexed cartMandateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    function createOrder(
        string memory cartMandateId,
        address merchant,
        uint256 amount,
        uint256 expirySeconds
    ) external onlyOwner {
        require(bytes(orders[cartMandateId].cartMandateId).length == 0, "Order already exists");
        require(amount > 0, "Amount must be positive");

        orders[cartMandateId] = CartMandate({
            cartMandateId: cartMandateId,
            merchant: merchant,
            payer: address(0),
            amount: amount,
            token: address(usdc),
            status: OrderStatus.Created,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expirySeconds
        });

        orderIds.push(cartMandateId);
        emit OrderCreated(cartMandateId, address(0), amount);
    }

    function payOrder(string memory cartMandateId) external {
        CartMandate storage order = orders[cartMandateId];
        require(bytes(order.cartMandateId).length > 0, "Order does not exist");
        require(order.status == OrderStatus.Created, "Order not in Created state");
        require(block.timestamp < order.expiresAt, "Order expired");

        order.payer = msg.sender;
        order.status = OrderStatus.Paid;

        usdc.safeTransferFrom(msg.sender, order.merchant, order.amount);

        emit PaymentSuccessful(cartMandateId, order.merchant, order.amount);
    }

    function getOrder(string memory cartMandateId) external view returns (CartMandate memory) {
        require(bytes(orders[cartMandateId].cartMandateId).length > 0, "Order does not exist");
        return orders[cartMandateId];
    }

    function totalOrders() external view returns (uint256) {
        return orderIds.length;
    }
}

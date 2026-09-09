import type { Order } from '../types'

// 订单配送状态(与 useDeliveryStatus 输出对应,优先级 delivered > active > pending)
type OrderStatus = 'pending' | 'active' | 'delivered'

// 状态 -> 文字标签 / 颜色(简单文字标签,不引入组件库)
const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; fontWeight: number }
> = {
  pending: { label: '等待配送', color: '#9e9e9e', fontWeight: 400 },
  active: { label: '配送中', color: '#f9a825', fontWeight: 700 },
  delivered: { label: '已送达', color: '#43a047', fontWeight: 700 },
}

interface OrderPanelProps {
  orders: Order[]
  // 已送达 / 正在配送的客户 id(由地图组件的配送状态 hook 上报);
  // 缺省时所有订单按 pending 显示
  deliveredCustomerIds?: string[]
  activeCustomerIds?: string[]
}

// OrderPanel:当前配送任务面板(纯展示)
// 明确告诉用户"现在求解的是这一批订单":
//   - 订单数量 / 总需求
//   - 配送点列表:🏠 客户名 需求:n + 配送状态文字标签
// 职责边界:不请求 API、不生成订单,数据全部由 props 下传
function OrderPanel({
  orders,
  deliveredCustomerIds = [],
  activeCustomerIds = [],
}: OrderPanelProps) {
  const totalDemand = orders.reduce((sum, order) => sum + order.demand, 0)

  const deliveredSet = new Set(deliveredCustomerIds)
  const activeSet = new Set(activeCustomerIds)

  // 单条订单状态:delivered > active > pending
  const statusOf = (customerId: string): OrderStatus => {
    if (deliveredSet.has(customerId)) return 'delivered'
    if (activeSet.has(customerId)) return 'active'
    return 'pending'
  }

  return (
    <div>
      <div className="stat-item">
        <span className="stat-label">订单数量</span>
        <span className="stat-value">{orders.length} 单</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">总需求</span>
        <span className="stat-value">{totalDemand} 件</span>
      </div>

      {orders.length === 0 ? (
        <p className="placeholder-inline">
          尚未生成订单,请先点击「生成订单」
        </p>
      ) : (
        <div
          style={{
            marginTop: 8,
            maxHeight: 240,
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: 12,
              color: '#999',
              background: '#fafafa',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            配送点({orders.length})
          </div>
          {orders.map((order, index) => {
            const status = statusOf(order.customer_id)
            const meta = STATUS_META[status]
            return (
              <div
                key={`${order.customer_id}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  fontSize: 13,
                  borderBottom:
                    index === orders.length - 1
                      ? 'none'
                      : '1px solid #f5f5f5',
                }}
              >
                <span>
                  <span style={{ marginRight: 6 }}>🏠</span>
                  {order.customer_name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* 配送状态文字标签:等待配送 / 配送中 / 已送达 */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: meta.fontWeight,
                      color: meta.color,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span style={{ color: '#666' }}>
                    需求:
                    <span style={{ fontWeight: 700, color: '#ff7043' }}>
                      {order.demand}
                    </span>
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OrderPanel

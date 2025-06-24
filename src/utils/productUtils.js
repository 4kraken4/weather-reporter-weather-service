import SequelizeProductModel from '../infrastructure/orm/SequelizeProductModel.js';

export function calculateTotalPrice(cartDetails, cartPrices) {
  let totalPrice = 0;
  cartDetails.cartItems.forEach(item => {
    totalPrice += cartPrices[item.id] * item.quantity;
  });
  return totalPrice;
}

export async function getProductPrices(cartDetails) {
  const cartItemIds = cartDetails.cartItems.map(i => i.id);
  return (
    await SequelizeProductModel.findAll({
      where: {
        id: cartItemIds
      }
    })
  ).reduce((acc, item) => {
    acc[item.id] = Number(item.dataValues.unitPrice);
    return acc;
  }, {});
}

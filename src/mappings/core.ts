import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { User, Product } from "../types/schema";
import { Escrow as EscrowTemplate } from "../types/templates";
import { ProductCreated } from "../types/EscrowFactory/EscrowFactory";
import {
  Escrow,
  OrderInitiate,
  OrderCancel,
  ShipmentInprogress,
  ShipmentUpdated,
  ReclaimBuyerCall,
  ReclaimFundCall,
} from "../types/templates/Escrow/Escrow";

export function handleProductCreated(event: ProductCreated): void {
  const user = createUser(event.params.seller);

  const productContractAddress = event.params.product;
  let product = Product.load(productContractAddress.toHexString());
  if (!product) {
    product = new Product(productContractAddress.toHexString());
    const productContract = Escrow.bind(productContractAddress);
    const fetchedProduct = productContract.product();

    product.stage = fetchedProduct.value1;
    product.productId = fetchedProduct.value2;
    product.price = fetchedProduct.value3;
    product.lockPeriod = fetchedProduct.value4;
    product.owner = user.id;
    product.name = fetchedProduct.value8;
    product.productURI = fetchedProduct.value9;
  }

  // create the tracked contract based on the template
  EscrowTemplate.create(productContractAddress);
  product.save();
}

export function handleOrderInitiate(event: OrderInitiate): void {
  const buyer = createUser(event.params._buyer);
  const productAddress = event.address.toHexString();
  let product = Product.load(productAddress);
  if (!product) return;

  product.buyer = buyer.id;
  // change stage to Waiting For Shipment
  product.stage = 1;
  product.save();
}

export function handelOrderCancel(event: OrderCancel): void {
  const productAddress = event.address.toHexString();
  let product = Product.load(productAddress);
  if (!product) return;

  product.buyer = null;
  // change stage to Initiate
  product.stage = 0;
  product.save();
}

export function handleShipmentInprogress(event: ShipmentInprogress): void {
  const productAddress = event.address.toHexString();
  let product = Product.load(productAddress);
  if (!product) return;

  // change stage to Initiate
  product.trackingId = event.params.trackingNo;
  product.stage = 2;
  product.save();
}

export function handleShipmentUpdated(event: ShipmentUpdated): void {
  const productAddress = event.address.toHexString();
  let product = Product.load(productAddress);
  if (!product) return;
  const deliveryStatus = event.params.status.toString();
  log.info("delivery = {}", [deliveryStatus]);
  product.deliveryStatus = deliveryStatus;
  if (deliveryStatus === "Delivered") {
    // change stage to Delivered
    product.stage = 3;
  }
  product.save();
}

export function handleReclaimFund(call: ReclaimFundCall): void {
  const productAddress = call.to;
  let product = Product.load(productAddress.toHexString());
  if (!product) {
    log.info("{} not found", [productAddress.toHexString()]);
    return;
  }

  product.stage = 4;
  product.save();
}

export function handleReclaimBuyer(call: ReclaimBuyerCall): void {
  const productAddress = call.to;
  let product = Product.load(productAddress.toHexString());
  if (!product) {
    log.info("{} not found", [productAddress.toHexString()]);
    return;
  }

  if (call.inputs._reclaim) {
    product.stage = 0;
    product.buyer = null;
  } else {
    product.stage = 1;
  }
  product.deliveryStatus = "";

  product.save();
}

function createUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (!user) {
    user = new User(address.toHexString());
    user.save();
  }
  return user;
}

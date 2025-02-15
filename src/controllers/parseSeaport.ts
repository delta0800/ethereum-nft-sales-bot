import { ethers } from 'ethers';
import { currencies } from '../config/currencies.js';
import {
    Market,
    TransactionData,
    SeaportOrder,
    OfferItem,
    ConsiderationItem
} from '../types/types';
import { formatPrice } from '../utils/api.js';

const parseSeaport = (tx: TransactionData, logMarket: Market, decodedLogData: SeaportOrder) => {
    const offer = decodedLogData.offer;
    const consideration = decodedLogData.consideration;
    const nftOnOfferSide = offer.some((item) => item.token.toLowerCase() === tx.contractAddress);
    const nftOnConsiderationSide = consideration.some(
        (item) => item.token.toLowerCase() === tx.contractAddress
    );
    let price;

    // Skip if the target token is not on both sides (offer & consideration)
    if (!nftOnOfferSide && !nftOnConsiderationSide) return null;

    // if target nft on offer side, then consideration is the total price
    // else offer is the total price
    if (nftOnOfferSide) {
        const totalConsiderationAmount = consideration.reduce(reducer, 0);
        price = totalConsiderationAmount;
    } else {
        const totalOfferAmount = offer.reduce(reducer, 0);
        price = totalOfferAmount;
    }
    tx.totalPrice += price;
    tx.marketList.push(logMarket);
    tx.prices.push(formatPrice(price));

    return [price, false];
};

function reducer(previous: number, current: OfferItem | ConsiderationItem) {
    const currency = currencies[current.token.toLowerCase() as keyof typeof currencies];
    if (currency !== undefined) {
        const result =
            previous + Number(ethers.utils.formatUnits(current.amount, currency.decimals));

        return result;
    } else {
        return previous;
    }
}

export { parseSeaport };

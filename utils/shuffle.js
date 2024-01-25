module.exports.shuffleCards = () => {
    const suit = ['hearts', 'spades', 'clubs', 'diamonds'];
    const value = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
    let potCards = [];
    for (i = 0; i < 5; i++) {
        let card = {};
        card.suit = suit[Math.floor(Math.random() * suit.length)];
        card.value = value[Math.floor(Math.random() * value.length)];
        card.color = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';
        card.isOpen = false;
        potCards.push(card);
    }
    console.log(potCards);
    return potCards;
};

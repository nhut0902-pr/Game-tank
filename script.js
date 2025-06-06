// --- Game Management Functions (Shop/Garage integration) ---

function getInventoryCategoryKey(itemType) {
    // SỬA LỖI: Luôn trả về key đúng cho inventory ('bodies', 'turrets', 'paints')
    return itemType === 'body' ? 'bodies' : itemType + 's';
}

function updateCurrencyDisplays() {
    const moneyStr = playerMoney.toLocaleString();
    currencyMenuDisplay.textContent = moneyStr;
    currencyShopDisplay.textContent = moneyStr;
    currencyGarageDisplay.textContent = moneyStr;
    if (gameActive) currencyGameDisplay.textContent = moneyStr;
}

function loadPlayerData() {
    const data = localStorage.getItem(PLAYER_DATA_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        playerMoney = parsed.money || 0;
        playerInventory = parsed.inventory || { bodies: ["body_default"], turrets: ["turret_default"], paints: ["paint_default_green"] };
        // Ensure default items are always present
        if (!playerInventory.bodies.includes('body_default')) playerInventory.bodies.unshift('body_default');
        if (!playerInventory.turrets.includes('turret_default')) playerInventory.turrets.unshift('turret_default');
        if (!playerInventory.paints.includes('paint_default_green')) playerInventory.paints.unshift('paint_default_green');

        playerEquipment = parsed.equipment || { body: "body_default", turret: "turret_default", paint: "paint_default_green" };
    }
    updateCurrencyDisplays();
    loadHighScores();
}

function savePlayerData() {
    const data = { money: playerMoney, inventory: playerInventory, equipment: playerEquipment };
    localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data));
}

function populateShop() {
    shopItemsContainer.innerHTML = '';
    for (const itemId in SHOP_ITEMS) {
        const item = SHOP_ITEMS[itemId];
        if (item.isDefault) continue;

        const categoryKey = getInventoryCategoryKey(item.type);
        const itemOwned = playerInventory[categoryKey]?.includes(itemId);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        let previewStyle = '';
        if (item.type === 'paint') {
            if (item.isShiny) {
                 previewStyle = `background: linear-gradient(135deg, ${LightenDarkenColor(item.color, 40)}, ${item.color}, ${LightenDarkenColor(item.color, -40)});`;
            } else if (item.colorPattern) {
                 previewStyle = `background-image: conic-gradient(${item.colorPattern.join(', ')});`;
            } else {
                 previewStyle = `background-color:${item.color};`;
            }
        }

        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <div class="item-preview-placeholder" style="${previewStyle}">${item.type !== 'paint' ? item.name.substring(0, 3) : ''}</div>
            <p>${item.description}</p>
            <p class="price">Giá: ${item.price.toLocaleString()} G</p>
            <button class="buy-button" data-item-id="${itemId}" ${itemOwned ? 'disabled' : ''}>
                ${itemOwned ? 'Đã Sở Hữu' : 'Mua Ngay'}
            </button>
        `;
        if (!itemOwned) {
            itemDiv.querySelector('.buy-button').onclick = () => buyItem(itemId);
        }
        shopItemsContainer.appendChild(itemDiv);
    }
}

function buyItem(itemId) {
    const item = SHOP_ITEMS[itemId];
    const categoryKey = getInventoryCategoryKey(item.type);
    const isOwned = playerInventory[categoryKey]?.includes(itemId);

    if (isOwned) {
        alert("Bạn đã sở hữu vật phẩm này rồi!");
        return;
    }

    if (playerMoney >= item.price) {
        playerMoney -= item.price;
        playerInventory[categoryKey].push(itemId);
        playSound('buy_item');
        updateCurrencyDisplays();
        savePlayerData();
        populateShop();
        populateGarage();
        alert(`${item.name} đã được mua!`);
    } else {
        alert("Không đủ tiền để mua vật phẩm này!");
    }
}

function populateGarage() {
    bodyItemsContainer.innerHTML = ''; turretItemsContainer.innerHTML = ''; paintItemsContainer.innerHTML = '';
    ['bodies', 'turrets', 'paints'].forEach(category => {
        const container = category === 'bodies' ? bodyItemsContainer : (category === 'turrets' ? turretItemsContainer : paintItemsContainer);
        playerInventory[category].forEach(itemId => {
            const item = SHOP_ITEMS[itemId];
            if (!item) return;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'garage-item';
            if (playerEquipment[item.type] === itemId) itemDiv.classList.add('equipped');

            let previewContent = '';
             if (item.type === 'paint') {
                 let style = item.isShiny ? `background: linear-gradient(135deg, ${LightenDarkenColor(item.color, 40)}, ${item.color})` : item.colorPattern ? `background-image: conic-gradient(from 90deg, ${item.colorPattern.join(', ')})` : `background-color:${item.color || '#ccc'}`;
                 previewContent = `<div class="item-preview-color" style="${style}"></div><p>${item.name}</p>`;
            } else {
                previewContent = `<div class="item-preview-placeholder">${item.name.substring(0, 3)}</div><p>${item.name}</p>`;
            }
            itemDiv.innerHTML = previewContent;
            itemDiv.onclick = () => equipItem(item.type, itemId);
            container.appendChild(itemDiv);
        });
    });
    drawGarageTankPreview();
}

function equipItem(itemType, itemId) {
    playerEquipment[itemType] = itemId;
    playSound('ui_click', 0.3);
    savePlayerData();
    populateGarage();
}

function drawGarageTankPreview() {
    ctxGarage.clearRect(0, 0, garageTankCanvas.width, garageTankCanvas.height);
    const previewTank = new Tank(garageTankCanvas.width / 2, garageTankCanvas.height / 2, true);
    previewTank.draw(ctxGarage);
}

function showShopScreen() { playSound('ui_click'); menuScreen.style.display = 'none'; shopScreen.style.display = 'block'; populateShop(); updateCurrencyDisplays(); }
function showGarageScreen() { playSound('ui_click'); menuScreen.style.display = 'none'; garageScreen.style.display = 'block'; populateGarage(); updateCurrencyDisplays(); }

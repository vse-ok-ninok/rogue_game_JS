class Game {
    constructor() {
        this.matrix = [];
        this.playerX = 0;
        this.playerY = 0;
        this.playerHealth = 100;
        this.playerPower = 20;
        this.enemies = []; // cсписок объектов следующего вида {x: ..., y: ..., health: ...}
        this.itemCount = 7; //5 зелья и 2 меча
        this.intervalIds = []; //для последующей отписки от интервала
        this.keyboardHandler = null; //для последующей отписки от слушителя
    };

    init() {
        this.generateMap();
        this.addCorridors();
        this.addRooms();
        this.placeItems('P', 1); //первый аргумент тип игрового объекта, второй - количество объектов
        this.placeItems('E', 10);
        this.placeItems('HP', 5);
        this.placeItems('SW', 2);

        this.intervalId = setInterval(this.gameLoop.bind(this), 500);
        this.intervalIds.push(this.intervalId);

        this.keyboardHandler = this.handlerKeyDown.bind(this);
        $(document).on('keydown', this.keyboardHandler);
    };

    gameLoop() {
        this.renderCard();
        this.enemies.map(enemy => {
            this.moveEnemies(enemy);
        });
        this.checkHealthEnemy();
        this.checkGameOver();
    };

    generateMap() {
        const matrix = Array(24).fill()
            .map(() => Array(40).fill('W'));
        this.matrix = matrix;
    }; 

    addCorridors() {
        function getUniqueRandomNumbers(count, max) {
            const numbers = new Set();    
            while (numbers.size < count) {
                numbers.add(Math.floor(Math.random() * max));
            }
            return Array.from(numbers);
        };
        const randomRows = getUniqueRandomNumbers(5, 24);
        const randomColumns = getUniqueRandomNumbers(5, 40);

        // Заполняем выбранные строки единицами
        randomRows.forEach(row => {
            this.matrix[row] = Array(40).fill('T');
        });

        // Заполняем выбранные столбцы единицами
        randomColumns.forEach(col => {
            for (let i = 0; i < 24; i++) {
                this.matrix[i][col] = 'T';
            }
        });
    }; 
    
    getFreeCoordinates() {
            function generateRandomX() {
                return Math.floor(Math.random() * 24);
            }
            
            function generateRandomY() {
                return Math.floor(Math.random() * 40);
            };
            let x, y;

            do {
                x = generateRandomX();
                y = generateRandomY();
            } while (this.matrix[x][y] !== 'T');
            return [ x, y ];
    };

    addRooms() {
        const numRooms = Math.floor(Math.random() * 6) + 5; 
        
        for (let i = 0; i < numRooms; i++) {
            // Генерируем случайные размеры комнаты
            const width = Math.floor(Math.random() * 6) + 3;  
            const height = Math.floor(Math.random() * 6) + 3; 
            
            // Находим случайную позицию для комнаты
            let x = Math.floor(Math.random() * (this.matrix[0].length - width));
            let y = Math.floor(Math.random() * (this.matrix.length - height));
            
            // Проверяем, не выходит ли комната за границы
            if (x + width > this.matrix[0].length || y + height > this.matrix.length) {
                continue;
            }
            
            if (!this.checkRoomIsolated(x, y, width, height)) {
                continue;
            };
            // Рисуем комнату
            for (let j = y; j < y + height; j++) {
                for (let k = x; k < x + width; k++) {
                    this.matrix[j][k] = 'T';
                    }
                };
            };
    };

    checkRoomIsolated(x, y, width, height) {
        for (let i = y; i < y + height; i++) {
            for (let j = x; j < x + width; j++) {
                if (
                    (i > 0 && this.matrix[i-1][j] === 'T') ||
                    (i < this.matrix.length-1 && this.matrix[i+1][j] === 'T') ||
                    (j > 0 && this.matrix[i][j-1] === 'T') ||
                    (j < this.matrix[0].length-1 && this.matrix[i][j+1] === 'T')
                ) {
                    return true;
                };
            }
        };
        return false;
    };

    renderCard() {
        $('.field').empty();
        const fragment = $('<div></div>');

        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 40; j++) {
                const tile = $('<div></div>');
                let classTile = '';
                const healthDiv = $('<div></div>').addClass('health');

                switch (this.matrix[i][j]) {
                    case 'W':
                        classTile = 'tileW';
                        break;
                    case 'T':
                        classTile = 'tile';
                        break;
                    case 'P':
                        classTile = 'tileP';
                        healthDiv.css('width', `${this.playerHealth}%`);
                        break;
                    case 'E':
                        classTile = 'tileE';
                        this.enemies.map(enemy => {
                            if (enemy.x === i && enemy.y === j) {
                                healthDiv.css('width', `${enemy.health}%`);
                            }
                        });
                        break;
                    case 'SW':
                        classTile = 'tileSW';
                        break;
                    case 'HP':
                        classTile = 'tileHP';
                        break;
                }

                tile.addClass(classTile).append(healthDiv);
                fragment.append(tile);
            }
        }

        $('.field').append(fragment.children());
    };

    placeItems(typeTile, count) {
        for (let i = 0; i < count; i++) {
            const position = this.getFreeCoordinates();
            this.matrix[position[0]][position[1]] = `${typeTile}`;
            if (typeTile === 'P') {
                this.playerX = position[0];
                this.playerY = position[1];
            };

            if (typeTile === 'E') {
                this.enemies.push({
                    x: position[0],
                    y: position[1],
                    health: 100
                });
            };
        };
    };

    getItemInventory(typeTile) {
        const inventoryItems = $('.inventory .items');
        const item = $('<div></div>').addClass(typeTile);
        inventoryItems.append(item);
    };

    movePlayer(x, y) {
        const newPosX = this.playerX + x;
        const newPosY = this.playerY + y;

        if (newPosX >= 0 && newPosX < 24 && newPosY >= 0 && newPosY < 40) {
            if (this.handlerCollision(newPosX, newPosY)) {
                this.matrix[newPosX][newPosY] = 'P';
                this.matrix[this.playerX][this.playerY] = 'T';

                this.playerX = newPosX;
                this.playerY = newPosY;
                this.renderCard();
            };
        };
    };

    attackEnemies() {
        const arrNeighbours = [[0, 1],[0, -1],[1, 0],[1, -1],[1, 1],[-1, 0],[-1, 1],[-1, -1]];
        arrNeighbours.map(neighbour => {
            const neighBourX = neighbour[0] + this.playerX;
            const neighBourY = neighbour[1] + this.playerY;
        
            if (this.matrix[neighBourX][neighBourY] === 'E') {
                this.enemies.map(enemy => {
                    if (enemy.x === neighBourX && enemy.y === neighBourY) {
                        enemy.health -= 20;
                    };
                });
            };
        });
    };

    randomDirectionEnemy() {
        // Случайно выбираем, какая ось останется неподвижной
        const axisToMove = Math.random() < 0.5 ? 'x' : 'y';

        // Случайно определяем направление движения по выбранной оси
        const directionValue = Math.random() < 0.5 ? -1 : 1;

        // Формируем вектор направления
        if (axisToMove === 'x') {
            return [directionValue, 0]; // Движение вдоль оси X
        } else {
            return [0, directionValue]; // Движение вдоль оси Y
        };
    };

    moveEnemies(enemy) {
        try {
            const directionEnemy = this.randomDirectionEnemy();
            const newPosX = enemy.x + directionEnemy[0];
            const newPosY = enemy.y + directionEnemy[1];
            if (this.matrix[newPosX][newPosY] === 'T') {
                this.matrix[newPosX][newPosY] = 'E';
                this.matrix[enemy.x][enemy.y] = 'T';
                    
                    enemy.x = newPosX;
                    enemy.y = newPosY;
                };
    
            this.attackPlayer(enemy.x, enemy.y);

        }
        catch(error) {
            return;
        }
    };

    attackPlayer(x,y) {
        const arrNeighbours = [[0, 1],[0, -1],[1, 0],[1, -1],[1, 1],[-1, 0],[-1, 1],[-1, -1]];
        arrNeighbours.map(neighbour => {
            const neighBourX = neighbour[0] + x;
            const neighBourY = neighbour[1] + y;
        
            if (this.matrix[neighBourX][neighBourY] === 'P') {
                this.playerHealth -= 20;
                console.log(this.playerHealth);
                console.log(this.matrix[neighBourX][neighBourY])
                this.renderCard();
            };
        });
    };

    handlerCollision(x, y) {
        if (this.matrix[x][y] === 'W' || this.matrix[x][y] === 'E') {
            return false;
        };

        if (this.matrix[x][y] === 'T') {
            return true;
        };
        if (this.matrix[x][y] === 'HP') {
            if (this.playerHealth < 100) {
                this.playerHealth += 20;
            }
            this.itemCount -= 1;
            this.getItemInventory('tileHP');
            return true;
        };

        if (this.matrix[x][y] === 'SW') {
            this.playerPower += 20;
            this.itemCount -= 1;
            this.getItemInventory('tileSW');
            return true;
        };
    };

    handlerKeyDown(e) {
            switch (e.code) {
                case 'KeyW':              
                    this.movePlayer(-1, 0);                
                    break;            
                case 'KeyA':                 
                    this.movePlayer(0, -1);
                    break;            
                case 'KeyS':                 
                    this.movePlayer(1, 0);                
                    break;            
                case 'KeyD':  
                    this.movePlayer(0, 1); 
                    break; 
                case 'Space':
                    this.attackEnemies();
                    break;         
            };

    };

    checkHealthEnemy() {
        this.enemies.map((enemy) => {
            if (enemy.health <= 0) {
                this.matrix[enemy.x][enemy.y] = 'T';
            }
        });

        this.enemies = this.enemies.filter((enemy) => {
            return enemy.health > 0;
        });
        this.renderCard();
        
    };

    checkGameOver() {
        if (this.playerHealth <= 0) {
            this.resetGame();
        };

        if (this.enemies.length === 0 && this.itemCount === 0) {
            this.resetGame();
        }
    };

    resetGame() {
        $('.field').empty();
        $('.inventory').empty();

        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];

        $(document).off('keydown', this.keyboardHandler);
        this.keyboardHandler = null;

        this.matrix = [];
        this.playerX = 0;
        this.playerY = 0;
        this.playerHealth = 100;
        this.playerPower = 20;
        this.enemies = [];
        this.itemCount = 7;

        const res = $('<div></div>')
                      .addClass('final')
                      .text('GAME OVER');
        $('.field').append(res);

        setTimeout(() => {
            $('.field').empty();
            this.init();
        }, 3000);
    };
};

$(document).ready(() => {
    const game = new Game();
    game.init();
});

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Board extends React.Component {
  render() {
    return (
      <table className="board-table">
        <tbody>
        {this.props.table.map((row, index) => {
          return (
            <tr key={index}>
              {row.map((td, index) => <td key={index} className={"block-type-" + td}></td>)}
            </tr>
          );
        })}
        </tbody>
      </table>
    );
  }
}

class TetrisInformationPanel extends React.Component {
  render() {
    return (
      <div>
      <p>LINES:{this.props.lines}</p>
      <p>{this.props.message}</p>
      </div>
    );
  }
}

class Tetris extends React.Component {
  constructor(props) {
    super(props);
    this.stageWidth = 10;
    this.stageHeight = 20;
    this.nextAreaSize = 6;
    this.blocks = this.createBlocks();
    this.deletedLines = 0;
    this.message = "";
    // boardTable, nextTableは、[y][x]の形式でアクセスする。
    // HTMLのtableの生成順序と合わせるため。
    this.boardTable = this.create2DArray(this.stageHeight, this.stageWidth);
    this.nextTable = this.create2DArray(this.nextAreaSize, this.nextAreaSize);

    this.state = {
      boardTable: this.clone2DArray(this.boardTable),
      nextTable: this.clone2DArray(this.nextTable),
      deletedLines: this.deletedLines,
      message: this.message,
    };

    window.onkeydown = (e) => {
      if (this.currentBlock == null) {
        return;
      }
      if (e.keyCode === 37) {
        this.moveLeft();
      } else if (e.keyCode === 38) {
        this.rotate();
      } else if (e.keyCode === 39) {
        this.moveRight();
      } else if (e.keyCode === 40) {
         this.fall();
      }
    }
  }

  componentDidMount() {
    this.startGame();
  }

  create2DArray(rows, cols) {
    let array = new Array(rows);
    for (let i = 0; i < rows; i++) {
      array[i] = new Array(cols).fill(null);
    }
    return array;
  }

  clone2DArray(src) {
    let dest = new Array(src.length);
    for (let i = 0; i < src.length; i++) {
      dest[i] = src[i].slice();
    }
    return dest;
  }

  createBlocks() {
    let blocks = [
      {
        shape: [[[-1, 0], [0, 0], [1, 0], [2, 0]],
                [[0, -1], [0, 0], [0, 1], [0, 2]],
                [[-1, 0], [0, 0], [1, 0], [2, 0]],
                [[0, -1], [0, 0], [0, 1], [0, 2]]]
      },
      {
        shape: [[[0, 0], [1, 0], [0, 1], [1, 1]],
                [[0, 0], [1, 0], [0, 1], [1, 1]],
                [[0, 0], [1, 0], [0, 1], [1, 1]],
                [[0, 0], [1, 0], [0, 1], [1, 1]]]
      },
      {
        shape: [[[0, 0], [1, 0], [-1, 1], [0, 1]],
                [[-1, -1], [-1, 0], [0, 0], [0, 1]],
                [[0, 0], [1, 0], [-1, 1], [0, 1]],
                [[-1, -1], [-1, 0], [0, 0], [0, 1]]]
      },
      {
        shape: [[[-1, 0], [0, 0], [0, 1], [1, 1]],
                [[0, -1], [-1, 0], [0, 0], [-1, 1]],
                [[-1, 0], [0, 0], [0, 1], [1, 1]],
                [[0, -1], [-1, 0], [0, 0], [-1, 1]]]
      },
      {
        shape: [[[-1, -1], [-1, 0], [0, 0], [1, 0]],
                [[0, -1], [1, -1], [0, 0], [0, 1]],
                [[-1, 0], [0, 0], [1, 0], [1, 1]],
                [[0, -1], [0, 0], [-1, 1], [0, 1]]]
      },
      {
        shape: [[[1, -1], [-1, 0], [0, 0], [1, 0]],
                [[0, -1], [0, 0], [0, 1], [1, 1]],
                [[-1, 0], [0, 0], [1, 0], [-1, 1]],
                [[-1, -1], [0, -1], [0, 0], [0, 1]]]
      },
      {
        shape: [[[0, -1], [-1, 0], [0, 0], [1, 0]],
                [[0, -1], [0, 0], [1, 0], [0, 1]],
                [[-1, 0], [0, 0], [1, 0], [0, 1]],
                [[0, -1], [-1, 0], [0, 0], [0, 1]]]
      }
    ];
    return blocks;
  }  
  
  drawBlock(x, y, type, angle, table) {
    let block = this.blocks[type];
    for (let i = 0; i < block.shape[angle].length; i++) {
      this.drawCell(table,
               x + block.shape[angle][i][0],
               y + block.shape[angle][i][1],
               type);
    }
  }

  drawCell(table, x, y, type) {
    if (y < 0) {
      return;
    }
    table[y][x] = type;
  }

  startGame() {
    // virtualStageは、xxTableと異なり、[x][y]の形式でアクセスする。
    this.virtualStage = this.create2DArray(this.stageWidth, this.stageHeight);
    this.currentBlock = null;
    this.nextBlock = this.getRandomBlock();
    this.mainLoop();
  }

  mainLoop() {
    if (this.currentBlock == null) {
      if (!this.createNewBlock()) {
        return;
      }
    } else {
      this.fallBlock();
    }
    this.drawStage();
    if (this.currentBlock != null) {
      this.drawBlock(this.blockX, this.blockY,
          this.currentBlock, this.blockAngle, this.boardTable);
    }
    this.refresh();
    setTimeout(this.mainLoop.bind(this), 500);
  }

  refresh() {
    this.setState({
      boardTable: this.clone2DArray(this.boardTable),
      nextTable: this.clone2DArray(this.nextTable),
      deletedLines: this.deletedLines,
      message: this.message,
    });
  }

  createNewBlock() {
    this.currentBlock = this.nextBlock;
    this.nextBlock = this.getRandomBlock();
    this.blockX = Math.floor(this.stageWidth / 2 - 2);
    this.blockY = 0;
    this.blockAngle = 0;
    this.drawNextBlock();
    this.refresh();
    if (!this.checkBlockMove(this.blockX, this.blockY, this.currentBlock, this.blockAngle)) {
      this.message = "GAME OVER";
      this.refresh();
      return false;
    }
    return true;
  }

  drawNextBlock() {
    this.clear(this.nextTable);
    this.drawBlock(2, 1, this.nextBlock, 0, this.nextTable);
  }

  getRandomBlock() {
    return  Math.floor(Math.random() * 7);
  }

  fallBlock() {
    if (this.checkBlockMove(this.blockX, this.blockY + 1, this.currentBlock, this.blockAngle)) {
        this.blockY++;
    } else {
        this.fixBlock(this.blockX, this.blockY, this.currentBlock, this.blockAngle);
        this.currentBlock = null;
    }
  }

  checkBlockMove(x, y, type, angle) {
    for (let i = 0; i < this.blocks[type].shape[angle].length; i++) {
      let cellX = x + this.blocks[type].shape[angle][i][0];
      let cellY = y + this.blocks[type].shape[angle][i][1];
      if (cellX < 0 || cellX > this.stageWidth - 1) {
          return false;
      }
      if (cellY > this.stageHeight - 1) {
          return false;
      }
      if (this.virtualStage[cellX][cellY] != null) {
          return false;
      }
    }
    return true;
  }

  fixBlock(x, y, type, angle) {
    for (let i = 0; i < this.blocks[type].shape[angle].length; i++) {
      let cellX = x + this.blocks[type].shape[angle][i][0];
      let cellY = y + this.blocks[type].shape[angle][i][1];
      this.virtualStage[cellX][cellY] = type;
    }
    for (let y = this.stageHeight - 1; y >= 0; ) {
      let filled = true;
      for (let x = 0; x < this.stageWidth; x++) {
        if (this.virtualStage[x][y] == null) {
          filled = false;
          break;
        }
      }
      if (filled) {
        for (let y2 = y; y2 > 0; y2--) {
          for (let x = 0; x < this.stageWidth; x++) {
            this.virtualStage[x][y2] = this.virtualStage[x][y2 - 1];
          }
        }
        this.deletedLines++;
      } else {
        y--;
      }
    }
  }

  drawStage() {
    this.clear(this.boardTable);

    for (let x = 0; x < this.virtualStage.length; x++) {
      for (let y = 0; y < this.virtualStage[x].length; y++) {
        if (this.virtualStage[x][y] != null) {
          this.drawCell(this.boardTable,
                        x, y, this.virtualStage[x][y]);
        }
      }
    }
  }

  moveLeft() {
    if (this.checkBlockMove(this.blockX - 1, this.blockY, this.currentBlock, this.blockAngle)) {
      this.blockX--;
      this.refreshStage();
    }
  }

  moveRight() {
    if (this.checkBlockMove(this.blockX + 1, this.blockY, this.currentBlock, this.blockAngle)) {
      this.blockX++;
      this.refreshStage();
    }
  }

  rotate() {
    let newAngle;
    if (this.blockAngle < 3) {
      newAngle = this.blockAngle + 1;
    } else {
      newAngle = 0;
    }
    if (this.checkBlockMove(this.blockX, this.blockY, this.currentBlock, newAngle)) {
      this.blockAngle = newAngle;
      this.refreshStage();
    }
  }

  fall() {
    while (this.checkBlockMove(this.blockX, this.blockY + 1, this.currentBlock, this.blockAngle)) {
      this.blockY++;
      this.refreshStage();
    }
  }

  refreshStage() {
    this.clear(this.boardTable);
    this.drawStage();
    if (this.currentBlock != null) {
      this.drawBlock(this.blockX, this.blockY,
          this.currentBlock, this.blockAngle, this.boardTable);
    }
    this.refresh();
  }

  clear(table) {
    for (let y = 0; y < table.length; y++) {
      for (let x = 0; x < table[y].length; x++) {
        table[y][x] = null;
      }
    }
  }
  
  render() {
    return (
      <div className="wrapper-container">
        <span className="tetris-container">
          <Board
            table = {this.state.boardTable}
          />
          <span className="tetris-panel-container">
            <p>Next:</p>
            <Board
              table = {this.state.nextTable}
              />
            <TetrisInformationPanel
              lines = {this.state.deletedLines}
              message = {this.state.message}
            />
            <div className="tetris-panel-container-padding"></div>
            <table className="tetris-button-panel">
              <tbody>
              <tr>
                <td></td>
                <td id="tetris-rotate-button" className="tetris-button" onMouseDown = {this.rotate.bind(this)}>↻</td>
                <td></td>
              </tr>
              <tr>
                <td id="tetris-move-left-button"className="tetris-button" onMouseDown = {this.moveLeft.bind(this)}>←</td>
                <td id="tetris-fall-button" className="tetris-button" onMouseDown = {this.fall.bind(this)}>↓</td>
                <td id="tetris-move-right-button" className="tetris-button" onMouseDown = {this.moveRight.bind(this)}>→</td>
              </tr>
              </tbody>
            </table>
          </span>
        </span>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Tetris />,
  document.getElementById('root')
);

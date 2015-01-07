/*global math*/
'use strict';
function hexToRGB(h) {
  h = (h.charAt(0)==='#') ? h.substring(1,7):h;
  return {
    r: parseInt(h.substring(0,2),16),
    g: parseInt(h.substring(2,4),16),
    b: parseInt(h.substring(4,6),16)
  };
}

function hexToRGBCSV(h) {
  var rgb = hexToRGB(h);
  return '' + rgb.r + ', ' + rgb.g + ', ' + rgb.b;
}

var googleColors = ['#2196F3', '#F44336', '#8BC34A', '#FFC107', '#673AB7'];

/*exported googleColor */
function googleColor(step) {
  return googleColors[step % googleColors.length];
}


function zeroMatrix(rows, columns) {
  var m = [];
  for(var row=0; row<rows; row++) {
    m[row] = [];
    for(var column=0; column<columns; column++) {
      m[row][column] = 0;
    }
  }
  return m;
}

function nodeConnectsTo(nodeFrom, nodeTo) {
  return nodeFrom.outgoers().filter('node#' + nodeTo.id()).length === 1;
}

/*exported constructLinkMatrix */
function constructLinkMatrix(nodes) {
  var m = zeroMatrix(nodes.length, nodes.length);
  nodes.each(function(column, columnNode) {
    var outdegree = columnNode.outdegree(false);
    nodes.each(function(row, rowNode) {
      if(nodeConnectsTo(columnNode, rowNode)) {
        m[row][column] = 1/outdegree;
      }
    });
  });
  return m;
}
/*exported constructGoogleMatrix */
function constructGoogleMatrix(stochasticMatrix, nodeCount, alpha) {
  var randomJumpMatrix = math.multiply(math.multiply(math.ones(nodeCount, nodeCount), 1/nodeCount), 1-alpha);
  stochasticMatrix = math.multiply(stochasticMatrix, alpha);
  return math.add(stochasticMatrix, randomJumpMatrix);
}


/*exported constructStochasticMatrix */
function constructStochasticMatrix(nodes) {
  var m = zeroMatrix(nodes.length, nodes.length);
  nodes.each(function(column, columnNode) {
    var outdegree = columnNode.outdegree(false);
    if(outdegree === 0) {
      for(var i=0; i<nodes.length; i++) {
        m[i][column] = 1/nodes.length;
      }
    } else {
      nodes.each(function (row, rowNode) {
        if (nodeConnectsTo(columnNode, rowNode)) {
          m[row][column] = 1 / outdegree;
        }
      });
    }
  });
  return m;
}

function colorDefines(nodes) {
  var colors = '';
  nodes.each(function(row, rowNode) {
    colors += '\\definecolor{matrixcolor' + rowNode.id() + '}{RGB}{' + hexToRGBCSV(rowNode.data('col')) + '} ';
  });
  return colors;
}

/*exported constructLatexGoogleMatrix */
function constructLatexGoogleMatrix(nodes, alpha) {
  var colors = colorDefines(nodes);
  var matrix = '\\alpha = ' + alpha + '\\\\';
  var r =   ' + (1-\\alpha) \\cdot \\frac{1}{' + nodes.length + '} ';
  matrix += '\\begin{bmatrix}';
  nodes.each(function(row, rowNode) {
    nodes.each(function(column, columnNode) {
      var outdegree = columnNode.outdegree(false);

      matrix += '{\\color{matrixcolor' + columnNode.id() + '}';
      if(outdegree === 0) {
        matrix += ' \\alpha \\cdot \\frac{1}{' + nodes.length + '} ' + r;
      } else {
        if (nodeConnectsTo(columnNode, rowNode)) {
          if (outdegree === 1) {
            matrix += ' \\alpha \\cdot 1 ' + r;
          } else {
            matrix += ' \\alpha \\cdot \\frac{1}{' + outdegree + '} ' + r;
          }
        } else {
          matrix += '0 ' + r;
        }
      }
      matrix += '}';
      if(column < nodes.length -1) {
        matrix += '& ';
      }
    });
    if(row < nodes.length-1) {
      matrix += '\\\\';
    }
  });
  matrix += '\\end{bmatrix}';
  return '$$' + colors + matrix + '$$';
}

/*exported constructLatexStochasticMatrix */
function constructLatexStochasticMatrix(nodes) {
  var colors = colorDefines(nodes);
  var matrix = '\\begin{bmatrix}';
  nodes.each(function(row, rowNode) {
    nodes.each(function(column, columnNode) {
      var outdegree = columnNode.outdegree(false);

      matrix += '{\\color{matrixcolor' + columnNode.id() + '}';
      if(outdegree === 0) {
        matrix += '\\frac{1}{' + nodes.length + '} ';
      } else {
        if (nodeConnectsTo(columnNode, rowNode)) {
          if (outdegree === 1) {
            matrix += '1 ';
          } else {
            matrix += '\\frac{1}{' + outdegree + '} ';
          }
        } else {
          matrix += '0 ';
        }
      }
      matrix += '}';
      if(column < nodes.length -1) {
        matrix += '& ';
      }
    });
    if(row < nodes.length-1) {
      matrix += '\\\\';
    }
  });
  matrix += '\\end{bmatrix}';
  return '$$' + colors + matrix + '$$';
}

/*exported constructLatexLinkMatrix */
function constructLatexLinkMatrix(nodes) {
  var colors = colorDefines(nodes);
  var matrix = '\\begin{bmatrix}';
  nodes.each(function(row, rowNode) {
    nodes.each(function(column, columnNode) {
      var outdegree = columnNode.outdegree(false);
      matrix += '{\\color{matrixcolor' + columnNode.id() + '}';
      if(nodeConnectsTo(columnNode, rowNode)) {
        if(outdegree === 1) {
          matrix += '1 ';
        } else {
          matrix += '\\frac{1}{' + outdegree + '} ';
        }
      } else {
        matrix += '0 ';
      }
      matrix += '}';
      if(column < nodes.length -1) {
        matrix += '& ';
      }
    });
    if(row < nodes.length-1) {
      matrix += '\\\\';
    }
  });
  matrix += '\\end{bmatrix}';
  return '$$' + colors + matrix + '$$';
}

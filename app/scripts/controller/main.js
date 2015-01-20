/*global cytoscape, introJs, angular, key, MathJax, math, googleColor,constructLinkMatrix, constructLatexLinkMatrix, constructLatexStochasticMatrix, constructStochasticMatrix, constructLatexGoogleMatrix, constructGoogleMatrix*/
'use strict';


//$(function () { // on dom ready


var pagerankApp = angular.module('pagerankApp', []);

pagerankApp.controller('main', function ($scope) {


  var nodeInt = 4;

  var layoutOptions = {
    name: 'circle',
    avoidOverlap: true,
    fit: true, // whether to fit to viewport
    padding: 30, // fit padding
    animate: true, // whether to transition the node positions
    animationDuration: 500 // duration of animation in ms if enabled
  };

  var spamColor = '#333333';
  var linkMatrix;
  var stochasticMatrix;
  var googleMatrix;
  $scope.detGoogleMatrix = '?';
  $scope.detLinkMatrix = '?';
  $scope.detStochasticMatrix = '?';
  $scope.matrixToUse = 2;
  $scope.setMatrixToUse = function(matrixID) {
    $scope.matrixToUse = matrixID;
  }
  var alpha = 0.9;
  $scope.ranks = [];
  var ranksVector;
  $scope.rankSum = 1;

  // Iterations ***********************************
  $scope.iteration = 0;

  $scope.iterate = function () {
    iterate();
    cy.layout(layoutOptions);
  };

  $scope.iterate10 = function () {
    for (var i = 0; i < 10; i++) {
      iterate();
    }
    cy.layout(layoutOptions);
  };

  $scope.resetRanks = function () {
    resetRanks(cy);
  };


  var iterate = function () {
    var matrix = $scope.matrixToUse === 0 ? linkMatrix : ($scope.matrixToUse === 1 ? stochasticMatrix : googleMatrix);
    ranksVector = math.multiply(matrix, ranksVector);
    updateRanks(cy);
    $scope.iteration++;
  };

  $scope.rankColor = function(col) {
    return (col === spamColor) ? 'white' : col;
  };

  var spamNodeIndex = 1;


  var updateRanks = function (c) {
    var ranksVectorArray = [];
    var sum = 0;
    /* jshint unused: false */
    ranksVector.forEach(function (value, index, matrix) {
      ranksVectorArray[index] = value;
      sum += value;
      //console.log('value:', value, 'index:', index);
    });
    var ranksArray = [];
    c.nodes().each(function (index, node) {
      node.data('rank', 20 + ranksVectorArray[index] * 150);
      ranksArray[index] = {
        col: node.data('col'),
        nodeID: node.id(),
        rank: ranksVectorArray[index]
      };
    });
    $scope.rankSum = sum;
    $scope.ranks = ranksArray;
  };

  var resetRanks = function (c) {
    $scope.iteration = 0;
    ranksVector = math.multiply(1 / c.nodes().length, math.ones(c.nodes().length));
    updateRanks(c);
    $scope.$apply();
  };

  // Matrices *************************************


  var updateMatrices = function (nodes) {
    linkMatrix = math.matrix(constructLinkMatrix(nodes));
    $scope.detLinkMatrix = math.det(linkMatrix);
    $('#linkmatrix').html(constructLatexLinkMatrix(nodes));
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'linkmatrix']);


    stochasticMatrix = math.matrix(constructStochasticMatrix(nodes));
    $scope.detStochasticMatrix = math.det(stochasticMatrix);
    googleMatrix = constructGoogleMatrix(stochasticMatrix, nodes.length, alpha);
    $scope.detGoogleMatrix = math.det(googleMatrix);


    $('#stochasticmatrix').html(constructLatexStochasticMatrix(nodes));
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'stochasticmatrix']);

    $('#googlematrix').html(constructLatexGoogleMatrix(nodes, alpha));
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'googlematrix']);
  };


  var cy = cytoscape({
    container: document.getElementById('cy'),

    // interaction
    panningEnabled: true,
    userPanningEnabled: true,
    wheelSensitivity: 1,
    //boxSelectionEnabled: false,

    // initial viewport
    zoom: 1,
    pan: {x: 0, y: 0},

    // rendering
    motionBlur: false,

    // style
    style: cytoscape.stylesheet()
      .selector('node')
      .css({
        'content': 'data(id)',
        'text-valign': 'center',
        'color': 'black',
        'width': 'data(rank)',
        'height': 'data(rank)',
        'background-color': 'data(col)',
        'text-outline-width': 2,
        'text-outline-color': 'white'
      })
      .selector('edge')
      .css({
        'target-arrow-shape': 'triangle',
        'line-color': 'data(col)',
        'target-arrow-color': 'data(col)',
        'width': 3
      })
      .selector(':selected')
      .css({
        'border-color': '#000',
        'border-width': 6,
        'border-style': 'double'
        //'line-color': '#5BC0DE',
        //'target-arrow-color': '#5BC0DE',
        //'source-arrow-color': '#5BC0DE'
      })
      .selector('.faded')
      .css({
        'line-color': '#fff',
        'opacity': 0.25,
        'text-opacity': 0,
        'target-arrow-color': '#fff',
        'source-arrow-color': '#fff'
      }),

    elements: {
      nodes: [
        {data: {id: 'P1', rank: 0, col: googleColor(1)}},
        {data: {id: 'P2', rank: 0, col: googleColor(2)}},
        {data: {id: 'P3', rank: 0, col: googleColor(3)}}
      ],
      edges: [
        {data: {source: 'P1', target: 'P2', col: googleColor(1)}},
        {data: {source: 'P1', target: 'P3', col: googleColor(1)}},
        {data: {source: 'P2', target: 'P3', col: googleColor(2)}},
        {data: {source: 'P3', target: 'P1', col: googleColor(3)}}
      ]
    },

    layout: layoutOptions,

    // on graph initial layout done (could be async depending on layout...)
    ready: function () {
      window.cy = this;

      // giddy up...


      cy.on('tap', 'edge', function (e) {
        var edge = e.cyTarget;
        edge.select();
        if (actions[editorMode] && actions[editorMode][EditorActions.edgeTap]) {
          actions[editorMode][EditorActions.edgeTap](e);
        }
      });

      cy.on('tap', 'node', function (e) {
        var node = e.cyTarget;
        node.select();
        //var neighborhood = node.neighborhood().add(node);
        //cy.elements().addClass('faded');
        //neighborhood.removeClass('faded');
        if (actions[editorMode] && actions[editorMode][EditorActions.nodeTap]) {
          actions[editorMode][EditorActions.nodeTap](e);
        }
      });


      cy.on('tap', function (e) {
        cy.elements().unselect();
        if (e.cyTarget === cy) {
          //cy.elements().removeClass('faded');
          if (actions[editorMode] && actions[editorMode][EditorActions.cyTap]) {
            actions[editorMode][EditorActions.cyTap](e);
          }
        }
      });
    }
  });

  // Intro.js setup
  var intro = introJs().setOptions({});

  $(window).resize(function () {
    cy.resize();
  });

  //Editor Mode

  // Editor functionality *******************
  var EditorModes = Object.freeze({'select': 0, 'nodeAdd': 1, 'edgeAdd': 2, 'nodeDelete': 3, 'spamAdd': 4});
  var editorMode = EditorModes.select;
  var EditorActions = Object.freeze({'cyTap': 0, 'nodeTap': 1, 'edgeTap': 2, 'cyDrag': 3});

  var actions = {};
  var editorModeButtons = {
    'selectButton': $('#buttonselect'),
    'addNodeButton': $('#buttonadd'),
    'addEdgeButton': $('#buttonedgeadd'),
    'deleteNodeButton': $('#buttondelete'),
    'addSpamButton': $('#spamadd')
  };
  var switchEditorMode = function (mode, sender) {
    if (actions[editorMode] && actions[editorMode].exitMode) {
      actions[editorMode].exitMode();
    }

    for (var buttonKey in editorModeButtons) {
      editorModeButtons[buttonKey].removeClass('editor-mode-active');
    }
    editorMode = mode;
    sender.addClass('editor-mode-active');
    if (actions[editorMode] && actions[editorMode].enterMode) {
      actions[editorMode].enterMode();
    }
  };

  // editor mode buttons
  key('q', function () {
    switchEditorMode(EditorModes.select, editorModeButtons.selectButton);
  });
  $('#buttonselect').click(function () {
    switchEditorMode(EditorModes.select, editorModeButtons.selectButton);
  });

  key('w', function () {
    switchEditorMode(EditorModes.nodeAdd, editorModeButtons.addNodeButton);
  });
  $('#buttonadd').click(function () {
    switchEditorMode(EditorModes.nodeAdd, editorModeButtons.addNodeButton);
  });

  editorModeButtons.addSpamButton.click(function () {
    switchEditorMode(EditorModes.spamAdd, editorModeButtons.addSpamButton);
  });

  key('e', function () {
    switchEditorMode(EditorModes.edgeAdd, editorModeButtons.addEdgeButton);
  });
  editorModeButtons.addEdgeButton.click(function () {
    switchEditorMode(EditorModes.edgeAdd, editorModeButtons.addEdgeButton);
  });



  key('d', function () {
    switchEditorMode(EditorModes.nodeDelete, editorModeButtons.deleteNodeButton);
  });
  editorModeButtons.deleteNodeButton.click(function () {
    switchEditorMode(EditorModes.nodeDelete, editorModeButtons.deleteNodeButton);
  });

  $('#buttoninfo').click(function () {

  });

  $('#buttonhelp').click(function () {
    intro.start();
  });
  switchEditorMode(EditorModes.select, editorModeButtons.selectButton);

  // Action definition
  //--------------------------------------------------------------------

  // Select
  actions[EditorModes.select] = {};
  actions[EditorModes.select].enterMode = function () {

  };
  actions[EditorModes.select].exitMode = function () {

  };


  // Node Add
  actions[EditorModes.nodeAdd] = {};
  actions[EditorModes.nodeAdd].enterMode = function () {

  };
  actions[EditorModes.nodeAdd].exitMode = function () {

  };
  actions[EditorModes.nodeAdd][EditorActions.cyTap] = function (e) {
    cy.add({
      group: 'nodes',
      data: {
        id: 'P' + nodeInt++,
        rank: 0,
        col: googleColor(nodeInt - 1)
      },
      renderedPosition: {x: e.cyRenderedPosition.x, y: e.cyRenderedPosition.y}

    });
    cy.layout(layoutOptions);
    updateMatrices(cy.nodes());
    resetRanks(cy);
  };

  // Spam Add
  actions[EditorModes.spamAdd] = {};
  actions[EditorModes.spamAdd].enterMode = function () {

  };
  actions[EditorModes.spamAdd].exitMode = function () {

  };
  actions[EditorModes.spamAdd][EditorActions.cyTap] = function (e) {
    cy.add({
      group: 'nodes',
      data: {
        id: 'S' + spamNodeIndex++,
        rank: 0,
        col: spamColor
      },
      renderedPosition: {x: e.cyRenderedPosition.x, y: e.cyRenderedPosition.y}

    });
    cy.layout(layoutOptions);
    updateMatrices(cy.nodes());
    resetRanks(cy);
  };

  // Delete Node
  actions[EditorModes.nodeDelete] = {};
  actions[EditorModes.nodeDelete].enterMode = function () {

  };
  actions[EditorModes.nodeDelete].exitMode = function () {

  };
  actions[EditorModes.nodeDelete][EditorActions.edgeTap] = function(e) {
      cy.remove(e.cyTarget);
    cy.layout(layoutOptions);
    updateMatrices(cy.nodes());
    resetRanks(cy);
  };
  actions[EditorModes.nodeDelete][EditorActions.nodeTap] = function (e) {
    //console.log('delete');
    cy.remove(e.cyTarget);
    cy.layout(layoutOptions);
    updateMatrices(cy.nodes());
    resetRanks(cy);
  };


  // Edge actions
  actions[EditorModes.edgeAdd] = {};
  actions[EditorModes.edgeAdd].enterMode = function () {
    actions[EditorModes.edgeAdd].e1 = null;
  };
  actions[EditorModes.edgeAdd].exitMode = function () {
    actions[EditorModes.edgeAdd].e1 = null;
  };
  /*jshint unused:false */
  actions[EditorModes.edgeAdd][EditorActions.cyTap] = function (e) {

    actions[EditorModes.edgeAdd].e1 = null;
  };
  /*jshint unused:true */

  actions[EditorModes.edgeAdd][EditorActions.nodeTap] = function (e) {
    var obj = actions[EditorModes.edgeAdd];
    if (obj.e1 === null) {
      obj.e1 = e.cyTarget;
    } else {
      var double = false;
      if(obj.e1.id() === e.cyTarget.id()) {
        return;
      }
      cy.edges().forEach(function (edge) {
        if (edge.data('source') === obj.e1.id() && edge.data('target') === e.cyTarget.id()) {
          double = true;
        }
      });
      if (!double) {
        cy.add({
          group: 'edges',
          data: {
            source: obj.e1.id(),
            target: e.cyTarget.id(),
            col: obj.e1.data('col')
          }
        });
        cy.layout(layoutOptions);
        updateMatrices(cy.nodes());
        resetRanks(cy);
      }
      obj.e1 = null;
    }

  };

  updateMatrices(cy.nodes());
  resetRanks(cy);

});


//--------------------------------------------------------------------
//}); // on dom ready

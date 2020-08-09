/**
 * Create a open translate menu item.
 * @param {Event} event The open event.
 */
function onOpen(event) {
  SlidesApp.getUi().createAddonMenu()
      .addItem('Open TE Copy', 'showSidebar')
      .addToUi();
}

/**
 * Open the Add-on upon install.
 * @param {Event} event The install event.
 */
function onInstall(event) {
  onOpen(event);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService
      .createHtmlOutputFromFile('sidebar')
      .setTitle('TE Copy');
  SlidesApp.getUi().showSidebar(ui);
}

function copyDeck() {
  var sourceDeck = SlidesApp.getActivePresentation();
  var targetDeck = null;
  var baseUrl =
    "https://slides.googleapis.com/v1/presentations/{presentationId}/pages/{pageObjectId}/thumbnail";
  var parameters = {
    method: "GET",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    contentType: "application/json",
    muteHttpExceptions: true
  };

  var firstSourceSlide = sourceDeck.getSlides()[0];
  var firstSourceNotes = firstSourceSlide.getNotesPage();
  
  var shape = firstSourceNotes.getSpeakerNotesShape();
  var sourceIdMatch = shape.getText().asString().trim().match(/:::copy-te-source-id:::[-_0-9a-z]+:::/i);
  var targetIdMatch = shape.getText().asString().trim().match(/:::copy-te-target-id:::[-_0-9a-z]+:::/i);
  var newSourceIdMatch = null;
  var newTargetIdMatch = null;
  
  if (sourceIdMatch === null || sourceIdMatch.split('---')[1] !== sourceDeck.getId()) {
    newSourceIdMatch = '---copy-te-source-id---' + sourceDeck.getId() + '---';
    targetDeck = SlidesApp.create(sourceDeck.getName() + ' - Student Deck');
    newTargetIdMatch = '---copy-te-target-id---' + targetDeck.getId() + '---';
  }
  else {
    targetDeck = SlidesApp.openById(targetIdMatch.split('---')[1]);
    if (targetDeck === null) {
      targetDeck = SlidesApp.create(sourceDeck.getName() + ' - Student Deck');
      newTargetIdMatch = '---copy-te-target-id---' + targetDeck.getId() + '---';
    }
  }
    
  if (newSourceIdMatch !== null) {
    if (sourceIdMatch !== null) {
      Logger.log('mw replace sourceId(' + sourceIdMatch + ', ' + newSourceIdMatch + ')');
      shape.getText().replaceAllText(sourceIdMatch, newSourceIdMatch);
    }
    else {
      Logger.log('mw append sourceId(' + newSourceIdMatch + ')');
      shape.getText().appendText(newSourceIdMatch + '\n');
    }
  }
  if (newTargetIdMatch !== null) {
    if (targetIdMatch !== null) {
      Logger.log('mw replace targetId(' + sourceIdMatch + ', ' + newSourceIdMatch + ')');
      shape.getText().replaceAllText(targetIdMatch, newTargetIdMatch);
    }
    else {
      Logger.log('mw append targetId(' + newSourceIdMatch + ')');
      shape.getText().appendText(newTargetIdMatch + '\n');
    }
  }
  if (newSourceIdMatch !== null || newTargetIdMatch !== null) {
    Logger.log('mw save sourceDeck ?!');
  }

  
  targetDeck.getSlides().forEach(function(s) {
    s.remove();
  });
  sourceDeck.getSlides().forEach(function(s) {
    var isTE = false;
    s.getShapes().forEach(function(shape) {
      Logger.log('mw getShapeType() returns= ' + shape.getShapeType() + 'typeof= ' + typeof shape.getShapeType());
      if (shape.getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
        Logger.log('mw getText() -> >>' + shape.getText().asString().trim() + '<<');
        if (shape.getText().asString().trim() === 'TE') {
          Logger.log('isTE set to true');
          isTE = true;
        }
      }
    });
    if (!isTE) {
      var url = baseUrl
        .replace("{presentationId}", sourceDeck.getId())
        .replace("{pageObjectId}", s.getObjectId());
      Logger.log("mw url= " + url);
      var response = JSON.parse(UrlFetchApp.fetch(url, parameters));
      Logger.log("mw response = " + JSON.stringify(response)); 
      var blob = UrlFetchApp.fetch(response.contentUrl).getBlob();

      targetDeck.appendSlide().getBackground().setPictureFill(blob);
    }
  });
  
  targetDeck.saveAndClose();
}
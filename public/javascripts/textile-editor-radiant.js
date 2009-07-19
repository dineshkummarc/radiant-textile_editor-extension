// Show the Textile Editor Helper if Textile is the selected filter
var filterObserver = Class.create();

filterObserver.prototype = {
  initialize: function(element) {
    this.textarea = element;
    if ($('snippet_filter')) {
      this.select = $('snippet_filter');
    } else {
      this.select = $(this.textarea.id.gsub('content', 'filter_id'));
    }
    this.change(); // set the toolbar initially
    Event.observe(this.select, 'change', this.change.bindAsEventListener(this), false);
  },

  change: function() {
    toolbar = $("textile-toolbar-" + this.textarea.id);

    if (this.select.value == "Textile") {
      TextileEditor.initialize(this.textarea.id, "extended");
    } else if (toolbar != null) {
      toolbar.parentNode.removeChild(toolbar);
    }
  }
}

Event.observe(window, 'load', load_textile_editor);

function load_textile_editor(){
  parts = $$('.form-area textarea').each(function(e) {
    new filterObserver(e);
  });
}



var Popup = Class.create();
Popup.prototype = {
  initialize: function(button) {
    this.textArea = $(button).canvas;
    this.popupElement = this.getPopupWindow();
    this.form = this.popupElement.getElementsBySelector('form')[0];
    this.submit = this.popupElement.getElementsBySelector('button.submit')[0];
    this.copyLabelFromAddress = true;
    this.textSelection = this.getTextSelection();
    
    this.form.reset();
    this.initializeFields();
    this.center();
    
    // Subclass observers
    this.initializeObservers();
    
    // General observers
    Event.observe(this.submit, 'click', this.transform.bindAsEventListener(this));
    this.popupElement.getElementsBySelector('.transform_choice input').each(function(item) {
      Event.observe(item, 'click', this.switchTransformChoice.bindAsEventListener(this));
    }.bind(this));
    
    Element.show(this.popupElement);    
  },
  
  transformationType: function() {
    var buttonGroup = this.form.transform_choice;
    if (buttonGroup.length) {
      for (var i=0; i<buttonGroup.length; i++) {
        if (buttonGroup[i].checked) {
          transformationType = buttonGroup[i].value;
        }
      }
    } else {
      transformationType = buttonGroup.value
    }
    return transformationType;
  },
  

  center: function() {
    var header = $('header')
    element = $(this.popupElement);
    element.style.position = 'absolute';
    var dim = Element.getDimensions(element);
    var top = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;
    element.style.top = (top + 200) + 'px';
    element.style.left = ((header.offsetWidth - dim.width) / 2) + 'px';
  },
  
  insertTextSelection: function(textInsert) {
    // See TextileEditorHelper's insertTag function to make cross-browser compatible
    finalText = this.textSelection.beginningText 
            + textInsert
            + this.textSelection.followupText;
    cursorPos = this.textSelection.startPos + textInsert.length;

    // set the appropriate DOM value with the final text
    this.textArea.value = finalText;
    this.textArea.scrollTop = this.textSelection.scrollTop;

    this.textArea.selectionStart = cursorPos;
    this.textArea.selectionEnd = cursorPos;
  },
  
  getTextSelection: function() {
    // figure out cursor and selection positions
    var startPos = this.textArea.selectionStart;
    var endPos = this.textArea.selectionEnd;
    var cursorPos = endPos;
    var scrollTop = this.textArea.scrollTop;

    // set-up the text vars
    var beginningText = this.textArea.value.substring(0, startPos);
    var followupText = this.textArea.value.substring(endPos, this.textArea.value.length);

    // check if text has been selected
    if (startPos != endPos) {
      textSelected = true;
      var selectedText = this.textArea.value.substring(startPos, endPos); 
    }

    return {beginningText : beginningText, followupText : followupText, selectedText : selectedText, startPos : startPos, endPos : endPos, scrollTop : scrollTop, cursorPos : cursorPos};
  },
  
  copyText: function(copyFrom) {
    switch(this.transformationType()) {
      case 'web':
        copyFrom = $('web_text');
      break
      case 'email':
        copyFrom = $('email_text');
      break
      case 'attachment':
        copyFrom = $('attachment_text');
      break
      default: alert('something wrong'); 
    }
    if (this.copyLabelFromAddress) {
      var copyTo = $('display_text');
      copyTo.value = copyFrom.value;
    }
  },
  
  displayTextObserver: function() {
    if ($('display_text').value == '') {
      this.copyLabelFromAddress = true;
    } else {
      this.copyLabelFromAddress = false
    }
  },
  
  startCopyLabelFromAddress: function() {
    if ($('display_text').value == '') this.copyLabelFromAddress = true;
  }
}

// Subclass of Popup specifically for adding links
var LinkPopup = Class.create();
Object.extend(Object.extend(LinkPopup.prototype,Popup.prototype),{
  getPopupWindow: function() {
    return $('link-popup');
  },
  
  initializeFields: function() {
    var linkPattern = /"([^"]*)":([\w-.:\/@]*)/;
    var emailPattern = /<r:enkode_mailto email="([^"]+)"( link_text="([^"]+)")?[^>]*\/>/;
    var attachmentPattern = /<r:attachment:link name="([^"]+)"[^>]*>(([^<]+)<\/r:attachment:link)?/;
    var assetPattern = /<r:asset:link id="([^"]+)"( size="([^"]+)")?[^>]*>(([^<]+)<\/r:asset:link)?/;
    if (this.textSelection['selectedText']) {
      if (this.textSelection['selectedText'].match(linkPattern)) {
        $('display_text').value = RegExp.$1;
        $('web_text').value = RegExp.$2;
        this.switchTransformChoice($$("#link_transform_choice_link input")[0]);

      } else if (this.textSelection['selectedText'].match(emailPattern)) {
        $('display_text').value = RegExp.$3;
        $('email_text').value = RegExp.$1;
        this.switchTransformChoice($$("#link_transform_choice_email input")[0]);

      } else if (this.textSelection['selectedText'].match(attachmentPattern)) {
        $('display_text').value = RegExp.$3;
        $('attachment_text').value = RegExp.$1;
        this.switchTransformChoice($$("#link_transform_choice_attachment input")[0]);

      } else if (matches = this.textSelection['selectedText'].match(assetPattern)) {
        $('display_text').value = RegExp.$5;
        $('asset_id').value = RegExp.$1;
        $('asset_size').value = RegExp.$3;

        this.switchTransformChoice($$("#link_transform_choice_asset input")[0]);
      } else {
        $('display_text').value = this.textSelection['selectedText'];
        this.switchTransformChoice($$("#link_transform_choice_link input")[0]);
      }
      this.copyLabelFromAddress = false;
    } else {
      this.switchTransformChoice($$("#link_transform_choice_link input")[0]);
    }
  },
  
  transform: function() {
    displayText = $('display_text');
    switch(this.transformationType()) {
      case 'web':
        webAddress = $('web_text');
        webAddressValue = webAddress.value;
        webAddressText = displayText.value;
        if (webAddressValue.getHostname() == window.location.toString().getHostname()) {
          webAddressValue = webAddressValue.gsub(RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im'), '');
          webAddressText = webAddressText.gsub(RegExp('^(?:f|ht)tp(?:s)?\://', 'im'), '');
        }
        if (webAddressText != '') {
          textInsert = '"'+webAddressText+'":'+webAddressValue;
        }
        else {
          textInsert = webAddressValue;
        }
      break
      case 'email':
        emailAddress = $('email_text');
        emailAddressValue = emailAddress.value;
        emailAddressText = displayText.value;
        if (emailAddressText != '') {
          textInsert = '<r:enkode_mailto email="'+emailAddressValue+'" link_text="'+emailAddressText+'" />';
        }
        else {
          textInsert = '<r:enkode_mailto email="'+emailAddressValue+'" />';
        }
      break
      case 'attachment':
        attachment = $('attachment_text');
        attachmentValue = attachment.value;
        attachmentText = displayText.value;
        if (attachmentText == '') {
          textInsert = '<r:attachment:link name="'+attachmentValue+'" />';
        } else {
          textInsert = '<r:attachment:link name="'+attachmentValue+'">'+attachmentText+'</r:attachment:link>';
        }
      break
      case 'asset':
        assetID = $('asset_id').value;
        assetText = displayText.value;
        assetSize = $('asset_size').value;
        if (assetText == '') {
          textInsert = '<r:asset:link id="'+assetID+'" size="'+assetSize+'" />';
        } else {
          textInsert = '<r:asset:link id="'+assetID+'" size="'+assetSize+'">'+assetText+'</r:asset:link>';
        }
      break
      default: alert('something wrong'); 
    } 

    this.insertTextSelection(textInsert);
    Element.hide(this.popupElement);
  },

  switchTransformChoice: function(element) {
    if (element) element.checked = true;
    
    $$('.transform_input').each(function(node) {
      Element.hide(node);
    });

    $$('.transform_choice').each(function(node) {
      Element.removeClassName(node, 'transform_current');
    })

    Element.show('transform_input_' + this.transformationType());
    Element.addClassName('link_transform_choice_' + this.transformationType(), 'transform_current');
  },
  
  initializeObservers: function() {
    Event.observe($('display_text'), 'keyup', this.displayTextObserver.bindAsEventListener(this));
    Event.observe($('web_text'), 'keyup', this.copyText.bindAsEventListener(this));
    if($('email_text')) Event.observe($('email_text'), 'keyup', this.copyText.bindAsEventListener(this));
  }
  
});

// Subclass of Popup specifically for adding images
var ImagePopup = Class.create();
Object.extend(Object.extend(ImagePopup.prototype,Popup.prototype), {
  getPopupWindow: function() {
    return $('image-popup');
  },
  
  initializeFields: function() {
    var imgPattern = /!([^!(]*)(\(([^)]+)\))?!/;
    var attachmentPattern = /<r:attachment:image name="([^"]+)"( alt="([^"]+)")?[^>]*\/>/;
    var assetPattern = /<r:assets:image id="([^"]+)"( size="([^"]+)")?( alt="([^"]+)")?[^\/]*\/>/;
    var matches = [];
    console.log(this.textSelection['selectedText']);
    
    if (this.textSelection['selectedText']) {
      if (this.textSelection['selectedText'].match(imgPattern)) {
        $('img_web_text').value = RegExp.$1;
        $('alt_text').value = RegExp.$3;
        this.switchTransformChoice($$("#image_transform_choice_link input")[0]);

      } else if (this.textSelection['selectedText'].match(attachmentPattern)) {
        $('img_attachment_text').value = RegExp.$1;
        $('alt_text').value = RegExp.$3;
        this.switchTransformChoice($$("#image_transform_choice_attachment input")[0]);

      } else if (matches = this.textSelection['selectedText'].match(assetPattern)) {
        this.switchInputChoice($('img_asset_' + matches[1]))
        if (matches[3]) $('img_asset_size').value = matches[3];
        if (matches[5]) $('alt_text').value = matches[5];
        this.switchTransformChoice($$("#image_transform_choice_asset input")[0]);

      } else {
        $('alt_text').value = this.textSelection['selectedText'];
        this.switchTransformChoice($$("#image_transform_choice_link input")[0]);
      }
    } else {
      var field = $$("#image_transform_choice_upload input")[0] || $$("#image_transform_choice_attachment input")[0] || $$("#image_transform_choice_web input")[0];
      this.switchTransformChoice(field);
    }
  },
  
  transform: function() {
    altText = $('alt_text').value;
    switch(this.transformationType()) {
      case 'web':
        webAddress = $('img_web_text').value;
        if (altText == '') {
          textInsert = '!'+webAddress+'!';
        }
        else {
          textInsert = '!'+webAddress+'('+altText+')!';
        }
      break
      case 'attachment':
        attachment = $('img_attachment_text');
        attachmentValue = attachment.value;
        if (altText == '') {
          textInsert = '<r:attachment:image name="'+attachmentValue+'" />';
        } else {
          textInsert = '<r:attachment:image name="'+attachmentValue+'" alt="'+altText+'" />';
        }
      break
      case 'asset':
        assetID = this.selectedAssetID();
        assetSize = $('img_asset_size').value;
        if (altText == '') {
          textInsert = '<r:assets:image id="'+assetID+'" size="' + assetSize + '" />';
        } else {
          textInsert = '<r:assets:image id="'+assetID+'" size="' + assetSize + '" alt="'+altText+'" />';
        }
      break
      default: alert('something wrong'); 
    } 

    this.insertTextSelection(textInsert);
    Element.hide(this.popupElement);
  },

  switchTransformChoice: function(element) {
    // console.log('switchTransformChoice', arguments);
    
    if (element) element.checked = true;
    
    $$('.transform_input').each(function(node) {
      Element.hide(node);
    });

    $$('.transform_choice').each(function(node) {
      Element.removeClassName(node, 'transform_current');
    })

    Element.show('image_transform_input_' + this.transformationType());
    Element.addClassName('image_transform_choice_' + this.transformationType(), 'transform_current');
  },

  switchInputChoice: function(element) {
    if (element) element.checked = true;
    // console.log('switchInputChoice', arguments);
    
    $$('.asset_thumbnail').each(function(node) {
      Element.removeClassName(node, 'selected_thumbnail');
    })

    Element.addClassName(this.selectedThumbnail(), 'selected_thumbnail');
  },
  
  selectedAsset: function (argument) {
    var buttonGroup = this.form.img_asset_id;
    var assetID = null;
    for (var i=0; i<buttonGroup.length; i++) {
      if (buttonGroup[i].checked) {
        asset_id = buttonGroup[i].id;
        break;
      }
    }
    return asset_id;
  },
  
  selectedAssetID: function () {
    var a = this.selectedAsset();
    if (a) return a.split('_').pop();
  },
  
  selectedThumbnail: function() {
    return $(this.selectedAsset()  + '_thumbnail');
  },

  initializeObservers: function() {
    $$('.asset_picker').each(function (radiobutton) {
      Event.observe(radiobutton, 'click', this.switchInputChoice.bindAsEventListener(this));
    }.bind(this));
    
  }
  
});

String.prototype.getHostname = function() {
  var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
  var match = this.match(re);
  if (match) {
    return match[1].toString();
  } else {
    return null;
  }
}
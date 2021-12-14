//Generate random uuid
function generateRandomUUID(){
    return uuidv1();
}
//Remove all comment/highlight styles with corresponding id on delete comment/highlight
var removeStyleOnDelete = function(alloyEditor, className, isComment){
    if(!alloyEditor){
        return;
    }
    var e = alloyEditor.get('nativeEditor');
    if(e){
        if(isComment){
            var styleToRemove = new CKEDITOR.style({
                element: 'comment',
                attributes: {
                    'class': className
                }
            });
        } else {
            var styleToRemove = new CKEDITOR.style({
                element: 'highlight',
                attributes: {
                    'class': className
                }
            });
        }
        var range = new CKEDITOR.dom.range(e.document);
        range.selectNodeContents(e.document.getBody());
        e.getSelection().removeAllRanges();
        e.getSelection().selectRanges([range]);
        e.getSelection().lock();
        if(e.readOnly){
            $(e.element.$).attr('contenteditable', 'true');
            e.removeStyle(styleToRemove);
            $(e.element.$).attr('contenteditable', 'false');
        }
        else{
            e.removeStyle(styleToRemove);
        }
        e.getSelection().unlock();
        e.getSelection().removeAllRanges();
    }
};
// Alloy Editor toolbar configuration with highlight button
function createHighlightButton(){
    // Use the built-in version of React if your site does not use React
    var React = AlloyEditor.React;
    var id = generateRandomUUID();
    var ButtonHighlight = React.createClass({
        displayName: 'ButtonHighlight',
        mixins: [AlloyEditor.ButtonStyle, AlloyEditor.ButtonStateClasses, AlloyEditor.ButtonActionStyle],
        propTypes: {
            editor: React.PropTypes.object.isRequired
        },
        getDefaultProps: function getDefaultProps() {
            return {
                style: {
                    element: 'highlight',
                    attributes:{
                        'class': ''
                    }
                }
            };
        },
        statics: {
            key: 'highlight'
        },
        highlightBox: function highlightBox(){
            id = generateRandomUUID();
            var style = new CKEDITOR.style({
                element: 'highlight',
                attributes: {
                    'data-id': id,
                    'class': 'draft-highlight'
                }
            });
            var alloyEditor = this.props.editor;
            if(!alloyEditor){
                return;
            }
            var e = alloyEditor.get('nativeEditor');
            e.getSelection().lock();
            e.applyStyle(style);
            e.getSelection().unlock();
            e.fire("actionPerformed", this);
            $('.highlight-color.' + id).find('span[data-cke-bookmark]').remove();
        },
        render: function render() {
            var cssClass = 'ae-button';
            var elem = React.createElement(
                'button',
                { className: cssClass, 'title': 'Highlight', 'data-type': 'button-highlight', onClick:this.highlightBox, tabIndex: this.props.tabIndex },
                React.createElement('span', { className: 'ae-icon-highlight' })
            );
            return elem;
        }
    });
    AlloyEditor.Buttons[ButtonHighlight.key] = AlloyEditor.ButtonHighlight = ButtonHighlight;
};
// Alloy Editor toolbar configuration with comment button
function createCommentButton(){
    // Use the built-in version of React if your site does not use React
    var React = AlloyEditor.React;
    var id = generateRandomUUID();
    var html = "<div class='new-comment'><textarea placeholder='Add a comment'></textarea><p class='comment-actions'><span class='post-comment'>Post</span><span class='post-cancel'>Cancel</span></p></div>";
    var ButtonComment = React.createClass({
        displayName: 'ButtonComment',
        mixins: [AlloyEditor.ButtonStyle, AlloyEditor.ButtonStateClasses, AlloyEditor.ButtonActionStyle],
        propTypes: {
            editor: React.PropTypes.object.isRequired
        },
        getDefaultProps: function getDefaultProps() {
            return {
                style: {
                    element: 'comment',
                    attributes:{
                        'class': ''
                    }
                }
            };
        },
        statics: {
            key: 'comment'
        },
        commentBox: function commentBox(){
            id = generateRandomUUID();
            var style = new CKEDITOR.style({
                element: 'comment',
                attributes: {
                    'data-id': id,
                    'class': 'draft-comment'
                }
            });
            var alloyEditor = this.props.editor;
            if(!alloyEditor){
                return;
            }
            var e = alloyEditor.get('nativeEditor');
            e.getSelection().lock();
            e.applyStyle(style);
            e.getSelection().unlock();
            e.fire("actionPerformed", this);
            var top = e.getCaretRegion().top - 60;
            var parent = $('.page-comments');
            parent.html(html);
            parent.find('.new-comment').css('margin-top', top);
            parent.find('.new-comment textarea').focus();
            $('.comment-color.' + id).find('span[data-cke-bookmark]').remove();
            $('.post-comment').click(function(ev){
                ev.stopPropagation();
                var value = {
                    comment: $('.page-comments .new-comment textarea').val().trim(),
                    uid: id
                }
                ProjectManager.vent.trigger('add:comment', value);
            });
            $('.post-cancel').click(function(ev){
                if($('.new-comment').is(":visible")) {
                    $('.new-comment').remove();
                    removeStyleOnCommentDelete('draft-comment');
                }
            });
            $(document).mousedown(function(event) {
                if(!$(event.target).closest('.new-comment').length) {
                    if($('.new-comment').is(":visible")) {
                        $('.new-comment').remove();
                        removeStyleOnCommentDelete('draft-comment');
                    }
                }
            });
        },
        render: function render() {
            var cssClass = 'ae-button';
            var elem = React.createElement(
                'button',
                { className: cssClass, 'title': 'Add comment', 'data-type': 'button-comment', onClick:this.commentBox, tabIndex: this.props.tabIndex },
                React.createElement('span', { className: 'ae-icon-comment' })
            );
            return elem;
        }
    });
    AlloyEditor.Buttons[ButtonComment.key] = AlloyEditor.ButtonComment = ButtonComment;
}
//SetUp AlloyToolbar
function setUpAlloyToolbar(readOnly, node, showComment, showHighlight, isCommentToolbar){
    if (readOnly) {
        var Selections = [{
                name: 'text',
                buttons: ['comment', 'highlight'],
                test: function(payload){
                    var nativeEditor = payload.editor.get('nativeEditor');
                    var selectionEmpty = nativeEditor.isSelectionEmpty();
                    var selectionData = payload.data.selectionData;
                    return (!selectionData.element && selectionData.region && !selectionEmpty);
                }
            },
            {
                name: 'image',
                buttons: ['comment', 'highlight'],
                test: function(payload){
                    var selectionData = payload.data.selectionData;
                    return (selectionData.element && selectionData.element.getName() === 'img');
                }
            }];
        toolbars = {
            styles: {
                selections: Selections,
                tabIndex: 1
            }
        };
    } else if(isCommentToolbar){
        var linkButtonArray = [{ name:'linkEdit', cfg:{ appendProtocol: true, showTargetSelector: false, defaultLinkTarget: '_blank' }}];
        var textButtonArray = [
             'bold',
             'italic',
             'quote',
             'underline',
             {
                name:'link',
                cfg:{
                    appendProtocol: true,
                    showTargetSelector: false,
                    defaultLinkTarget: '_blank'
                }
             }
        ];
        //Set selections
        var Selections = [
            {
                name: 'link',
                buttons: linkButtonArray,
                test: AlloyEditor.SelectionTest.link
            },
            {
                name: 'text',
                buttons: textButtonArray,
                test: AlloyEditor.SelectionTest.text
            }
        ];
        toolbars = {
            styles: {
                selections: Selections,
                tabIndex: 1
            }
        };
    } else {
        var linkButtonArray = [{ name:'linkEdit', cfg:{ appendProtocol: true, showTargetSelector: false, defaultLinkTarget: '_blank' }}];
        var imageButtonArray = ['imageLeft', 'imageCenter', 'imageRight'];
        var textButtonArray = [{
              name: 'styles',
              cfg:{
                showRemoveStylesItem: false,
                'styles': [
                        {
                            name: 'Normal',
                            style: {
                                element: 'p'
                            }
                        },
                        {
                            name: 'Header 1',
                            style: {
                                element: 'h1'
                            }
                        }, {
                            name: 'Header 2',
                            'style': {
                                'element': 'h2'
                            }
                        }, {
                            name: 'Code',
                            'style': {
                                'element': 'pre'
                            }
                        }
                     ]
              }
            },
             'Font',
             'FontSize',
             'bold',
             'italic',
             'quote',
             'underline',
             'TextColor',
             'BGColor',
             {
                name:'link',
                cfg:{
                    appendProtocol: true,
                    showTargetSelector: false,
                    defaultLinkTarget: '_blank'
                }
             }
        ];
        var tableButtonArray = ['tableRow', 'tableColumn', 'tableCell', 'tableRemove'];
        if(showComment){
            imageButtonArray.push('comment');
            textButtonArray.push('comment');
        }
        if(showHighlight){
            textButtonArray.push('highlight');
        }
        //Set selections
        var Selections = [
            {
                name: 'link',
                buttons: linkButtonArray,
                test: AlloyEditor.SelectionTest.link
            },
            {
                name: 'image',
                buttons: imageButtonArray,
                test: AlloyEditor.SelectionTest.image
            },
            {
                name: 'text',
                buttons: textButtonArray,
                test: AlloyEditor.SelectionTest.text
            },
            {
                name: 'table',
                buttons: tableButtonArray,
                getArrowBoxClasses: AlloyEditor.SelectionGetArrowBoxClasses.table,
                setPosition: AlloyEditor.SelectionSetPosition.table,
                test: AlloyEditor.SelectionTest.table
        }];
        toolbars = {
            add: {
                buttons: ['image', 'hline', 'table'],
                tabIndex: 2
            },
            styles: {
                selections: Selections,
                tabIndex: 1
            }
        };
    }
    //Setup alloyEditor
    var alloyEditor = AlloyEditor.editable(node, {
        title: false,
        toolbars: toolbars,
        readOnly: readOnly,
        extraPlugins: AlloyEditor.Core.ATTRS.extraPlugins.value + ',ae_richcombobridge,font,ae_uibridge,ae_panelmenubuttonbridge,colorbutton',
        removePlugins: AlloyEditor.Core.ATTRS.removePlugins.value + ',ae_embed'
    });
    return alloyEditor;
};
//Create comment and highlight button
createCommentButton();
createHighlightButton();
//Upload image in editor
function editorUploadImage(uploadingFiles, callback) {
    var image_urls = [];
    async.each(uploadingFiles, function(file, cb){
        var id = file.id;
        var $image = $(".upload-image[data-id='" + id + "']");
        if(!$image.length){
            cb();
        } else {
            var key, policy, signature;
            //Upload through CORS
            $.ajax({
                url: '/api/signed',
                type: 'GET',
                dataType: 'json',
                data: {title: file.name},
                async: false,
                success: function(data){
                    key = data.key;
                    policy = data.policy;
                    signature = data.signature;
                }
            });
            var finalUrl = 'https://chibuzz-uploads.s3.amazonaws.com/' + key;
            var fd = new FormData();
            fd.append('key', key);
            fd.append('AWSAccessKeyId', 'AKIAIT3BY3EDOZPAPDEQ');
            fd.append('acl', 'public-read');
            fd.append('Content-Type', file.type);
            fd.append('policy', policy);
            fd.append('signature', signature);
            fd.append('success-action-status', 201);
            fd.append('file', file);
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function(ev){
                $image.attr('src', finalUrl);
                $image.removeAttr('data-id');
                $image.removeClass('upload-image');
                image_urls.push(finalUrl);
                cb();
            }, false);
            xhr.addEventListener('error', function(ev){
                $image.remove();
                cb();
            }, false);
            xhr.addEventListener('abort', function(ev){
                $image.remove();
                cb();
            }, false);
            xhr.open('POST', 'https://chibuzz-uploads.s3.amazonaws.com/', true);
            xhr.send(fd);
        }
    }, function(err) {
        callback(image_urls);
    });
}

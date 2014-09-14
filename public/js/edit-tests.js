// Main editor instance
var editor = null;


var EditorHelper = {
    defaultSlideTime: 400,

    initHandlers: function() {
        var self = this;

        Globals.initDropdown('client-select-dd');
        Globals.initDropdown('test-select-dd', 'test-data-input', 'serialized');
        Globals.initDropdown('newtest-client-select-dd', 'newtest-client-id-input', 'id');
        Globals.initDropdown('newtest-type-select-dd', 'newtest-type-input', 'test_type');

        // Codemirror init
        require(['codemirror/lib/codemirror', 'codemirror/modes/javascript/javascript'], function(CodeMirror) {
            editor = CodeMirror.fromTextArea($('#editor')[0], {
                lineNumbers: true,
                mode: 'javascript',
                indentUnit: 4,
                viewportMargin: Infinity
            });
        });




        $('#client-select-dd .dropdown-menu li  a').click(function(e) {
            var clientId = $(this).data('id');
            $.ajax({
                url: '/api/client-tests/client/' + clientId,
                success: function(data) {
                    self.addTests(data);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error(textStatus);
                    console.error(errorThrown);
                }
            });
        });

        // Form handlers
        $('#test-data-input').change(function(e) {
            var testData = JSON.parse($(this).val());
            // Update hidden edit test input
            $('#edittest-id-input').val(testData._id);
            var fields = 'source';

            self.getTest(testData._id, fields, function(res) {

                var setEditorData = function() {
                    editor.setValue(res.test.source);
                    editor.refresh();
                };

                if(!HeaderFunctions.isCollapsed()) {
                    HeaderFunctions.enableCollapse();
                    HeaderFunctions.collapse(function() {
                        setEditorData();
                    });
                } else {
                    setEditorData();
                }

            }, function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(errorThrown);
                EditorHelper.showError(errorThrown);
            });
        });

        $('#test-edit-block form').on('submit', function(e) {
            e.preventDefault();
            EditorHelper.startLoading();
            // Save codemirror content into textarea
            editor.save();
            var formData = $('#test-edit-block form').serialize();

            EditorHelper.saveTest(formData, function(res) {
                EditorHelper.doneLoading();
            }, function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(errorThrown);
                EditorHelper.doneLoading();
                EditorHelper.showError(errorThrown);
            });
        });


        $('#new-test-block form').on('submit', function(e) {
            e.preventDefault();
            self.createTest($(this).serialize());
        });

        $('#new-test-btn').click(function(e) {
            self.slideDownBlock('new-test-block');
        });

        $('#edit-test-btn').click(function(e) {
            self.slideDownBlock('test-select-block', true, function() {
                self.slideDownBlock('test-edit-block', false);
            });

        });
    },

    addTests: function(testData) {
        if(!testData.success || testData.tests.length === 0) {
            return;
        }

        var $list = $('#test-select-dd ul.dropdown-menu');
        testData.tests.forEach(function(test, idx) {
            var $item = $('<li></li>');
            var $a = $('<a></a>');
            $a.data('serialized', JSON.stringify(test));
            $a.html(test.name);
            $item.append($a);
            $list.append($item);
        });
        $('#test-select-dd').fadeIn();
    },

    showEditor: function() {
        $('.CodeMirror').fadeIn();
    },

    collapseAll: function(cb) {
        var self = this;

        $('#new-test-block').slideUp(self.defaultSlideTime, function() {
            $('#test-edit-block').slideUp(self.defaultSlideTime, function() {
                $('#test-select-block').slideUp(self.defaultSlideTime, cb);
            });
        });
    },

    slideDownBlock: function(id, collapse, cb) {
        var self = this;
        cb = cb || function() {};
        if(typeof(collapse) === 'undefined') collapse = true;

        var slideDown = function() {
            $('#' + id).slideDown({duration: self.defaultSlideTime})
                .promise()
                .always(cb);
        };

        if(collapse) {
            this.collapseAll(function() {
                slideDown();
            });
        } else {
            slideDown();
        }

    },

    showError: function(msg) {
        $('#error-msg span').text(msg).fadeIn();
    },

    hideError: function() {
        $('#error-msg span').text('').hide();
    },

    startLoading: function() {
        $('#save-test-btn')
            .attr('disabled', 'true')
            .children('img')
            .fadeIn();
    },

    doneLoading: function() {
        $('#save-test-btn')
            .removeAttr('disabled')
            .children('img')
            .hide();
    },

    getTest: function(id, fields, success, error) {
        var url = '/api/client-tests/' + id;
        url = fields ? url + '/select/' + fields : url;
        $.ajax({
            type: 'GET',
            url: url,
            success: function(data) {
                success(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(errorThrown);
                //$('.spinner').hide();
                error(jqXHR, textStatus, errorThrown);
            }
        });
    },

    saveTest: function(data, success, error) {
        $.ajax({
            type: 'PUT',
            url: '/api/client-tests',
            data: data,
            success: success,
            error: error
        });
    },

    createTest: function(data) {
        if(!HeaderFunctions.isCollapsed()) {
            HeaderFunctions.enableCollapse();
            HeaderFunctions.collapse();
        }

        var self = this;
        $.ajax({
            type: 'POST',
            url: '/api/client-tests',
            data: data,
            success: function(res) {
                console.log(res);
                if(res.error) {
                    self.showError(res.message);
                    return;
                }

                editor.setValue(res.test.source);

                $('#edittest-id-input').val(res.test._id);
                $('#test-select-dd > a.dropdown-toggle').text(name);

                self.slideDownBlock('test-select-block', true, function() {
                    self.slideDownBlock('test-edit-block', false, function() {
                        editor.refresh();
                        editor.focus();
                    });
                });


            },
            error: function(jqXHR, textStatus, errorThrown) {
                self.showError(errorThrown);
            }
        });
    },

    sizeEditorToWindow: function() {
        var height = $(window).height();
        editor.setSize(null, height);
    }
};


$(document).ready(function() {
    EditorHelper.initHandlers();
});

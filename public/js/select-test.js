// Add necessary globals to the window
window.expect = chai.expect;

var TestSelectHelper = (function($) {

    return {
        initHandlers: function() {
            var self = this;

            var initDropdown = function(dropdownId, hiddenInputId, dataAttribName) {
                var ddId = '#' + dropdownId;

                $(ddId + ' .dropdown-menu').on('click', 'a', function(e) {
                    $('#' + hiddenInputId).val($(this).data(dataAttribName));
                    $(ddId + ' > a.dropdown-toggle').text($(this).text());

                    // Fire change event on hidden input for anything listening
                    $('#' + hiddenInputId).change();
                });
            };

            initDropdown('client-select-dd', 'client-id-input', 'id');
            initDropdown('res-select-dd', 'res-name-input', 'serialized');
            initDropdown('page-select-dd', 'page-name-input', 'page_name');

            // Fetch all tests on client select
            $('#client-id-input').change(function(e) {
                var clientId = $('#client-id-input').val();
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

            $('form#test-select-form').on('submit', function(e) {
                e.preventDefault();
                self.startLoading();
                var formData = $(this).serialize();
                $.ajax({
                    type: 'POST',
                    url: '/api/select-test',
                    data: formData,
                    success: function(data) {
                        self.runTests(data);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error(textStatus);
                        console.error(errorThrown);
                        $('.spinner').hide();
                    }
                });
            });

            $('#rerun-test').click(function(e) {
                self.startLoading();
                var success = function(data) {
                    console.log(data);
                    $('#test-script').remove();
                    self.attachScript(data.body, {
                        id: 'test-script'
                    });
                    self.runMocha();
                    self.doneLoading();
                };

                var error = function(jqXHR, textStatus, errorThrown) {
                    self.doneLoading();
                    self.showError(errorThrown);
                };

                try {
                    var resData = JSON.parse($('#res-name-input').val());
                    self.getTest(resData.Name, success, error);
                } catch(e) {
                    error(null, null, 'Cannot re-run test unless it is a static resource.');
                }
            });
        },

        attachScript: function(code, options) {
            options = options || {};
            cb = options.onLoad || function() {};
            id = options.id || '';

            var script = $('<script/>');
            script.attr('id', id);
            script.bind('load', cb);
            script.html(code);
            // Do this for future load event support
            $('head')[0].appendChild(script[0]);
        },

        showError: function(msg) {
            $('#error-msg span').text(msg).fadeIn();
        },

        hideError: function() {
            $('#error-msg span').text('').hide();
        },

        startLoading: function() {
            $('#test-select-block').hide();
            $('#mocha').empty();
            $('.spinner').fadeIn();
        },

        doneLoading: function() {
            $('.spinner').hide();
        },

        addTests: function(testData) {
            if(!testData.success || testData.tests.length === 0) {
                return;
            }

            var $list = $('#res-select-dd ul.dropdown-menu');
            testData.tests.forEach(function(test, idx) {
                var $item = $('<li></li>');
                var $a = $('<a></a>');
                $a.data('serialized', JSON.stringify(test));
                $a.html(test.name);
                $item.append($a);
                $list.append($item);
            });
            $('#res-select-dd').fadeIn();
        },

        runMocha: function() {
            if (window.mochaPhantomJS) { mochaPhantomJS.run(); }
            else { mocha.run(); }
        },

        getTest: function(testName, success, error) {
            var data = 'test_name=' + encodeURIComponent(testName);
            $.ajax({
                type: 'GET',
                url: '/getTest',
                data: data,
                success: success,
                error: error
            });
        },

        runTests: function(data) {
            var self = this;

            // Mocha setup
            mocha.ui('bdd');
            mocha.reporter('html');

            // Static resource test
            if(data.resource) {
                // Attach unit test code
                self.attachScript(data.test.source, {
                    id: 'test-script'
                });
                self.attachScript(data.resource.body, {
                    id: 'resource-script',
                    onload: function() {
                        console.log('LOADED');
                    }
                });
                self.runMocha();
                self.doneLoading();
                // Add href to rerun link
                $('#rerun-test').attr('href', '/testSelect?rerun=' + data.Name);
                $('#rerun-test-block').fadeIn();
                return;
            }

            require([
                'jquery',
                'page-parser'
            ], function($, PageParser) {

                self.doneLoading();

                var SfWindow = $(data.sfHtml);

                var scriptParser = new PageParser(SfWindow);
                var scripts = scriptParser.getTestableCode();
                console.log(scripts);
                // Attach unit test code
                self.attachScript(data.test.source, {
                    id: 'test-script'
                });

                scripts.forEach(function(script, idx) {
                    console.log(script);
                    var newScript = $('<script/>');
                    newScript.html($(script).html());
                    $('head').append(newScript);
                });

                self.runMocha();
                $('#rerun-test-block').fadeIn();
            });
        }
    };

})(jQuery);

$(document).ready(function() {
    TestSelectHelper.initHandlers();

    // If we have a rerun param, submit the form automatically
    if(QueryString.rerun) {

        // Check for a valid name
        $('#res-select-dd .dropdown-menu li a').each(function() {
            var data = $(this).data('serialized');
            if(data.Name === QueryString.rerun) {
                $('#res-name-input').val(JSON.stringify($(this).data('serialized')));
                $('#rerun-test').attr('href', '/testSelect?rerun=' + data.Name);
                $('form#test-select-form').submit();
                return false;
            }
            return true;
        });

    }
});

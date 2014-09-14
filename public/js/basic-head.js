// jQuery defaults
jQuery.easing.def = 'easeOutBack';
jQuery.fx.speeds._default = 800;

require.config({
    baseUrl: 'js/',
    paths: {
        jquery: 'jquery-2.1.1.min.js',
        codemirror: '/js/lib/codemirror'
    }
});

var HeaderFunctions = (function($) {
    var upArrowUrl = '/images/icons/svg/up14-white.svg';
    var downArrowUrl = '/images/icons/svg/down14-white.svg';

    var $mainHeader = null;
    var $miniHeader = null;
    var $userInfo = null;

    var init = function() {
        $mainHeader = $('#main-header');
        $miniHeader = $('#mini-header');
        $userInfo = $('#user-info-block');
    };

    // Perform init on page load
    $(document).ready(function() {
        init();
    });

    return {
        initHandlers: function() {
            var self = this;
            $miniHeader.find('a').click(function(e) {
                self.toggle();
            });
        },

        enableCollapse: function() {
            $miniHeader.show();
        },

        disableCollapse: function() {
            $miniHeader.hide();
        },

        isCollapsed: function() {
            return $mainHeader.is(':visible') === false;
        },

        toggle: function() {
            if($miniHeader.hasClass('header-collapsed')) {
                this.expand();
            } else {
                this.collapse();
            }
        },

        collapse: function(cb) {
            cb = cb || function() {};
            $userInfo.fadeOut();
            $mainHeader.slideUp({
                duration: 600,
                easing: 'easeOutQuad',
                complete: function() {
                    $miniHeader
                        .addClass('header-collapsed')
                        .find('img.slide-direction')
                        .attr('src', downArrowUrl);
                    cb();
                }
            });
        },

        expand: function() {
            $mainHeader.slideDown(function() {
                $miniHeader
                    .removeClass('header-collapsed')
                    .find('img.slide-direction')
                    .attr('src', upArrowUrl);
                $userInfo.fadeIn();
            });
        }
    };
})(jQuery);

var Globals = (function($) {


    return {
        initDropdown: function(dropdownId, hiddenInputId, dataAttribName) {
            var ddId = '#' + dropdownId;

            $(ddId + ' .dropdown-menu').on('click', 'a', function(e) {
                $('#' + hiddenInputId).val($(this).data(dataAttribName));
                $(ddId + ' > a.dropdown-toggle').text($(this).text());

                // Fire change event on hidden input for anything listening
                $('#' + hiddenInputId).change();
            });
        }
    };

})(jQuery);

// Util function for getting page params
// Usage:
//          Example URL: http://blah.com?myVar=wow
//          console.log(QueryString.myVar) will output "wow"
var QueryString = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]], pair[1] ];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
}();



$(document).ready(function() {
    HeaderFunctions.initHandlers();
    // Big slide config
    $('.menu-link').bigSlide();
});
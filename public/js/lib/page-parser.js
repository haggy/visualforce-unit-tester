define('page-parser', ['jquery'], function($) {
    function PageParser($page) {
        this.page = $page;
    }

    PageParser.prototype.getTestableCode = function() {
        var self = this;


        var scripts = [];
        self.page.find('script')
            .filter(function() {
                return $(this).data('unittest') === true || $(this).data('utdepend') === true;
            })
            .each(function(idx, script) {
                scripts.push(script);
            });
        return scripts;
    };


    return PageParser;
});








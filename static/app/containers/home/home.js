angular.module('App')
    .component('homeComp', {
        templateUrl: 'app/containers/home/home.html',
        controller: HomeCompCtrl,
        controllerAs: 'homeComp'
    });

function HomeCompCtrl($scope,CarList) {
    var homeComp = this;
    homeComp.cars = "";
    //get a list of the cars
    CarList.getCars().then(function(res){
        homeComp.cars = res;
    });
    homeComp.archive = function(id){
        //flag the car to be archived and not displayed.
        console.log('tried to archive car with id ', id);
        CarList.archiveCar(id).then(function(res){
            document.getElementById(id).remove();
        });
    };
    homeComp.update = function(){
        CarList.updateList().then(function(){
            $scope.$apply();
        });
    };
}

HomeCompCtrl.$inject = ['$scope','CarList'];

111var sinaUrlPre = "http://stock2.finance.sina.com.cn/futures/api/json.php/IndexService.getInnerFuturesDailyKLine?symbol=";//����sina url�������K����
var sinaUrlPreIF = "http://stock2.finance.sina.com.cn/futures/api/json.php/CffexFuturesService.getCffexFuturesDailyKLine?symbol=";
var maxLever = 5;//���ܸ�
var totalCanUsePerProductWithLever =0;//���ܸˣ�ÿ��Ʒ�ֿ����ʽ�
var LVCFMT_LEFT=0x0000 // �ű���ǩ���ı���������
var LVCFMT_RIGHT=0x0001 // �ű���ǩ���ı���������
var LVCFMT_CENTER=0x0002 // �ű���ǩ���ı���������
var dailyKLine={};//��K���ݣ���sina��ã����ѽ�������push�������β��
var arrayProductIDs;//=["CF","FG","MA","OI","RM","SR","TA","TC"]//����Ʒ��
var pIDs={}//����Ʒ��->������Լ
var map_InstrumentID_ProductID={}//��ԼID->Ʒ��ID��Ӧ��ϵ
var map_ProductID_InstrumentID={}//Ʒ��ID->��ԼID��Ӧ��ϵ
var map_ProductID_ExchangeID={}//Ʒ��ID->������ID��Ӧ��ϵ
var MarketData={}//���µ����ݣ���������������
var map_InstrumentInfo={}//��Լ��Ϣ����ѯ��Լ�ǻ��
var initDataFromSinaFinished={}//��sina��ʼ�������Ƿ������
var investorPosition={}//�ֲ�
var listInstrument=[]//�ű���ǩ���У�����������Լʱ���룬��ѯ�ֲ�ʱ���������������Լ��Ҳ����
var map_MainInstrumentID_RowIndex={};//������Լ��Ӧ���к�
var tradingAccount={}//�˺���Ϣ
///TFtdcPositionDateType��һ���ֲ���������
var THOST_FTDC_PSD_Today ='1';///���ճֲ�
var THOST_FTDC_PSD_History ='2';///��ʷ�ֲ�
function getStringPositionDateType(_PositionDate){
	if (_PositionDate == THOST_FTDC_PSD_Today)return "���ճֲ�";
	else if (_PositionDate == THOST_FTDC_PSD_History)return "��ʷ�ֲ�";
	return "δ֪";
}
///TFtdcPosiDirectionType��һ���ֲֶ�շ�������
var THOST_FTDC_PD_Net ='1'///��
var THOST_FTDC_PD_Long ='2'///��ͷ
var THOST_FTDC_PD_Short ='3'///��ͷ
function getStringPosiDirection(posiDirection){
	if (posiDirection == THOST_FTDC_PD_Net)return "��";
	else if (posiDirection == THOST_FTDC_PD_Long)return "��ͷ";
	else if (posiDirection == THOST_FTDC_PD_Short)return "��ͷ";
	return "δ֪";
}
//���ߺ��������������ϸ��Ϣ
function getDetail(obj){
	var ret="[";
	for(index in obj){
		ret += index + "=" + obj[index] + " , ";
	}
	ret = ret.substring(0,ret.length-2) + "]";	
	return ret;
}
//���ߺ������·�ǰ�油0
function pad(num, n) {
    var len = num.toString().length;
    while(len < n) {
        num = '0' + num;
        len++;
    }
    return num;
}
//�����Ƽ�����
function calcPositionSuggest(InstrumentID){
	var _vm = map_InstrumentInfo[InstrumentID].VolumeMultiple;//print("VolumeMultiple:"+InstrumentID+" "+_vm)
	var _lastPrice = MarketData[InstrumentID] .LastPrice;//print("���¼۸�:"+InstrumentID+" "+_lastPrice)
	var _num = totalCanUsePerProductWithLever/_lastPrice/_vm;//print("�Ƽ�����:"+InstrumentID+" --->"+_num)
	jstabUpdateItem(InstrumentID,"�Ƽ�����",_num.toFixed(2));
}
//���ÿ��Ʒ�ִ��ܸ��������ʽ�Ȼ���������������Լ�Ƽ�����
function calcAllPositionSuggest(){
	print("����������Լ�Ƽ�������")
	totalCanUsePerProductWithLever = tradingAccount.Balance*maxLever/arrayProductIDs.length;//���ܸˣ�ÿ��Ʒ�ֿ����ʽ�
	for(_p in pIDs){
		calcPositionSuggest(pIDs[_p]);
	}
}
//��ѯͶ�����˻���Ӧ
function onRspQryTradingAccount(data){
	print("��ѯͶ�����˻���Ӧ:"+getDetail(data));
	tradingAccount=data;
	calcAllPositionSuggest();
}
///��¼������Ӧ
function onRspUserLogin(data){
	print("��¼�ɹ�"
	+","+ data.BrokerName+","+ data.BrokerID+","+ data.InvestorID+" SystemName��"+ data.SystemName
	+"�����գ�"+ data.TradingDay+"������ʱ�䣺"+ data.SHFETime+"������ʱ�䣺"+ data.DCETime
	+"֣����ʱ�䣺"+ data.CZCETime+"�н���ʱ�䣺"+ data.FFEXTime+"��Դ����ʱ�䣺"+ data.INETime+"ǰ�ñ�ţ�"+ data.FrontID
	
	+"��󱨵����ã�"+ data.MaxOrderRef);
}
//���ݴ�������InstrumentID���жϸ�Ʒ���Ƿ��гֲ�
function hasPositionByProductID(InstrumentID){
	//����Ʒ��
	var _pID = getProductIDByInstrumentID(InstrumentID);
	//print("InstrumentID:"+InstrumentID+" _pID:"+_pID)
	//print("investorPosition:"+getDetail(investorPosition[InstrumentID]))
	for (p in investorPosition){
		//print("------"+investorPosition[p].InstrumentID+" p.Position:"+investorPosition[p].Position)
		//����������ĳֲֵ�Ʒ�֣����Ǹò�����Լ��Ʒ��
		if(getProductIDByInstrumentID(p) ==_pID && investorPosition[p].Position>0){
			return true;
		}
	}
	return false;
}
///�����ѯͶ���ֲ߳���Ӧ
function onRspQryInvestorPosition(data){
	print("�ֲ֣�"+getDetail(data))
	investorPosition[data.InstrumentID] = data;
	
	
	var nIndex=-1;
	//�������������Լ�����һ�У�������Լ���Ѿ���ӹ��ˡ�
	if(pIDs[getProductIDByInstrumentID(data.InstrumentID) ] !=data.InstrumentID){
		nIndex = jstabInsertItem(data.InstrumentID,[0,0,255]);
		
		//�ú�Լ���ֲܳ�
		jstabUpdateItem(data.InstrumentID,"�ֲ���",MarketData[data.InstrumentID].OpenInterest);
		//��������
		var sinaSymbol =data.InstrumentID;
		if(map_ProductID_ExchangeID[getProductIDByInstrumentID(data.InstrumentID) ]=="CZCE"){
			var _info = map_InstrumentInfo[data.InstrumentID];
			var sinaSymbol = obj+_info.DeliveryYear.toString().substring(2,4) +pad(_info.DeliveryMonth,2);
		}
		getDailyKLine (sinaSymbol,data.InstrumentID);
		listInstrument.push(data.InstrumentID)
	//�����������Լ
	}else{
		nIndex = map_MainInstrumentID_RowIndex[data.InstrumentID] 
	}
	
	
	jstabUpdateItem(nIndex,"�ֲ�����",getStringPositionDateType(data.PositionDate));
	jstabUpdateItem(nIndex,"���ճֲ�",data.YdPosition);
	jstabUpdateItem(nIndex,"���ճֲ�",data.Position);

	if (data.PosiDirection == THOST_FTDC_PD_Long){
		jstabUpdateItem(nIndex,"��շ���",getStringPosiDirection(data.PosiDirection),[200,0,0],[255,255,255]);
	}else if (data.PosiDirection ==THOST_FTDC_PD_Short ){
		jstabUpdateItem(nIndex,"��շ���",getStringPosiDirection(data.PosiDirection),[0,200,0],[255,255,255]);
	}else{
		jstabUpdateItem(nIndex,"��շ���",data.PosiDirection+getStringPosiDirection(data.PosiDirection));
	}
	jstabUpdateItem(nIndex,"������",data.OpenVolume);
	jstabUpdateItem(nIndex,"ƽ����",data.CloseVolume);
	//���Լ������������
	if(data.bIsLast){
		for(item in listInstrument){
			calcMA(listInstrument[item],"");
		}
	}
}

///�����ѯ��Լ��Ӧ
function onRspQryInstrument(data){
	//print(data.ProductID)
	//�÷���ֻ���ж����������Ƿ���ڣ����ڼ̳����Ի᷵��false��
	if(pIDs.hasOwnProperty(data.ProductID)){
		//print(data.InstrumentID+" "+data.ProductID+" "+data.ExchangeID+" "+data.InstrumentName+" "+data.VolumeMultiple+" "+data.PriceTick);
		//��ס���չ�ϵ
		map_InstrumentID_ProductID[data.InstrumentID] = data.ProductID;
		map_ProductID_InstrumentID[data.ProductID].push(data.InstrumentID);
		map_ProductID_ExchangeID[data.ProductID]=data.ExchangeID;//ÿ�θ���������ν
		
		map_InstrumentInfo[data.InstrumentID]=data;
	}
	if(data.bIsLast){
		print("��ѯ��Լ����");
		print("��Լ��Ʒ�ֶ�Ӧ��ϵ��"+getDetail(map_InstrumentID_ProductID))
		print("Ʒ�ֵ���Լ��Ӧ��ϵ��"+getDetail(map_ProductID_InstrumentID))
		print("Ʒ�ֵ���������Ӧ��ϵ��"+getDetail(map_ProductID_ExchangeID))
		print("��Լ��ϸ��Ϣ��"+getDetail(map_InstrumentInfo))
	}

}
//����������Լ
function calcMainByProductID(pID){
	var maxOpenInterest = 0;
	var maxOpenInterestInstrumentID="";
	for(_index in map_ProductID_InstrumentID[pID]){//��������
				var _InstrumentID = map_ProductID_InstrumentID[_productID][_index];
				//print(_instru +" : "+getDetail(MarketData[_instru]));
				var _OpenInterest = MarketData[_InstrumentID].OpenInterest;
				if(_OpenInterest>maxOpenInterest){
					maxOpenInterest = _OpenInterest
					maxOpenInterestInstrumentID = _InstrumentID;
				}
	}
	//print(pID+" ������Լ : "+maxOpenInterestInstrumentID+" ������Լ�ֲ֣� "+maxOpenInterest);
	pIDs[pID]=maxOpenInterestInstrumentID;
	var nIndex = jstabInsertItem(maxOpenInterestInstrumentID);
	jstabUpdateItem(maxOpenInterestInstrumentID,"�Ƿ�����","��");
	jstabUpdateItem(maxOpenInterestInstrumentID,"�ֲ���",maxOpenInterest);
	listInstrument.push(maxOpenInterestInstrumentID)
	//��ס���������Լ���кţ��ȳֲ���Ϣ��������Ҫ�����кŸ��±����
	map_MainInstrumentID_RowIndex[maxOpenInterestInstrumentID] = nIndex;
}
//����������Լ
function calcMain(){
	print("��ʼ����������Լ")
	//print(getDetail(MarketData));
	for(_productID in map_ProductID_InstrumentID){
		calcMainByProductID(_productID);
	}
	print("pIDs:"+getDetail(pIDs))
	//����sina����ȡ������Լ����ʷ��K
	//����sina����ȡ������Լ����ʷ��K
	for(obj in pIDs){
		var _InstrumentID = pIDs[obj];
		var sinaSymbol =_InstrumentID;
		if(map_ProductID_ExchangeID[obj]=="CZCE"){
			var _info = map_InstrumentInfo[_InstrumentID];
			var sinaSymbol = obj+_info.DeliveryYear.toString().substring(2,4) +pad(_info.DeliveryMonth,2);
		}
		getDailyKLine (sinaSymbol,_InstrumentID) ;
	}
}
//�Ӻ�Լ�õ�Ʒ��
function getProductIDByInstrumentID(instru){
	return map_InstrumentID_ProductID[instru];
}
//��Լ�Ƿ����ڲ���Ʒ��
function isNeedProcessByInstrumentID(instru){
	return pIDs.hasOwnProperty(getProductIDByInstrumentID(instru));
}
//����TD��������ʵʱ����
function onRspQryDepthMarketData(data){
	//���ݺ�ԼID�жϣ��Ƿ�ΪԤ�轻��Ʒ����صĺ�Լ
	if(isNeedProcessByInstrumentID(data.InstrumentID)){
		MarketData[data.InstrumentID] = data;
	}	
	if(data.bIsLast){//����������Լ
		print("TD���飺"+getDetail(MarketData))
		calcMain();
	}
}
//������ߣ��õ�������ʾ
function calcMA(InstrumentID,UpdateTime){
	var MA7 = MA(InstrumentID,7);
	var MA23 = MA(InstrumentID,23);
	var MA28 = MA(InstrumentID,28);
	jstabUpdateItem(InstrumentID,"MA7",MA7.toFixed(2));
	jstabUpdateItem(InstrumentID,"MA23",MA23.toFixed(2));
	jstabUpdateItem(InstrumentID,"MA28",MA28.toFixed(2));
	jstabUpdateItem(InstrumentID,"JS",UpdateTime);
	if(hasPositionByProductID(InstrumentID)){
		jstabUpdateItem(InstrumentID,"��ע","���гֲ�",[255,0,0],[0,255,0]);
		jstabUpdateItem(InstrumentID,"������ʾ","-");
		return;
	}
	var days = dailyKLine[InstrumentID];
	var _close = days[days.length-1][4];
	
	var _action = "-";	
	if(_close>MA7 && MA7>MA28){
		_action="����";
	}
	else if(_close<MA7 && MA7<MA28){
		_action="����";
	}
	jstabUpdateItem(InstrumentID,"��ע","-");
	jstabUpdateItem(InstrumentID,"������ʾ",_action);	
}
//����MD��������ʵʱ����
function onRtnDepthMarketData(data){

	MarketData[data.InstrumentID] = data;
	//���û�м�����ʷ���ݣ�����
	if(!initDataFromSinaFinished[data.InstrumentID]){
		//print(data.InstrumentID+"û�м�����ʷ����");
		return;
	}
	jstabUpdateItem(data.InstrumentID,"���¼�",data.LastPrice.toFixed(2));
	var days = dailyKLine[data.InstrumentID];
	if(days.length==0){
		print(data.InstrumentID+" ����Ϊ0���ݲ�����");
		return;
	}
	days[days.length-1][1]=data.OpenPrice;
	days[days.length-1][2]=data.HighestPrice;
	days[days.length-1][3]=data.LowestPrice;
	days[days.length-1][4]=data.LastPrice;
	calcMA(data.InstrumentID,data.UpdateTime);
}
//����web���õ���ʷ����
function getDailyKLine (InstrumentIDSina,InstrumentID) {
	if (InstrumentIDSina.substring(0,2)=="TC"){
		InstrumentIDSina=InstrumentIDSina.replace("TC","ZC");
	}
	print(sinaUrlPre+InstrumentIDSina)
	getFromUrl(sinaUrlPre+InstrumentIDSina,processHQFuturesData,[InstrumentID]);	
	
}
//����web���õ���ʷ���ݣ���ָ�ڻ�url��ͬ����Ʒ�ڻ�
function getDailyKLineIF (InstrumentIDSina,InstrumentID) {
	getFromUrl(sinaUrlPreIF+InstrumentIDSina,processHQFuturesData,[InstrumentID]);	
}

function onInit (_arrayProductIDs) {
	
	print("===onInit===============================================");
	print("����������"+onInit.length);
	print("ʵ�ʸ�����"+arguments.length);
	for (var i=0; i<arguments.length; i++)
	{
		print("����"+i+"��"+arguments[i]);
	}
	if(onInit.length!=arguments.length){
		print("������������!",[255,0,0]);
		return;
	}
	
	arrayProductIDs = eval(_arrayProductIDs);
	//return;
	for(var i in arrayProductIDs){//ÿ��Ʒ�ֵ�ȫ���ɽ��׺�Լ�Ǹ�����
		map_ProductID_InstrumentID[arrayProductIDs[i]]=[];
	}
	for(var i in arrayProductIDs){//pIDs��Ʒ��ID��Ӧ��������ԼID
		pIDs[arrayProductIDs[i]]="";
	}
	jstabInitList();//��ʼ���ű���ǩ
	jstabInsertColumn("��Լ����",0,60);
	jstabInsertColumn("�Ƿ�����",0,60);
	jstabInsertColumn("�ֲ���",LVCFMT_RIGHT,60);
	jstabInsertColumn("���¼�",LVCFMT_RIGHT,70);
	jstabInsertColumn("�ֲ�����",LVCFMT_RIGHT,70);
	jstabInsertColumn("���ճֲ�",LVCFMT_RIGHT,70);
	jstabInsertColumn("���ճֲ�",LVCFMT_RIGHT,70);
	jstabInsertColumn("��շ���",LVCFMT_RIGHT,70);
	jstabInsertColumn("������",LVCFMT_RIGHT,70);
	jstabInsertColumn("ƽ����",LVCFMT_RIGHT,70);
	jstabInsertColumn("MA7",LVCFMT_RIGHT,70);
	jstabInsertColumn("MA23",LVCFMT_RIGHT,70);
	jstabInsertColumn("MA28",LVCFMT_RIGHT,70);
	jstabInsertColumn("�Ƽ�����",LVCFMT_RIGHT,70);
	jstabInsertColumn("������ʾ",LVCFMT_RIGHT,70);
	jstabInsertColumn("JS",LVCFMT_RIGHT,70);
	jstabInsertColumn("��ע",LVCFMT_RIGHT,70);
	print("===onInit end===============================================");
}
//����MA
function MA(InstrumentID,n) {
	var days = dailyKLine[InstrumentID];
	if(!days){
		print(InstrumentID+" û������!days");
		return 0;
	}
	if(!days.length){
		print(InstrumentID+" û������!days.length");
		return 0;
	}
	if(days.length<n){
		print(InstrumentID+" ��������С�ڣ�"+n);
		return -1;
	}
	var num=0;
	for (var i = days.length-n; i < days.length; i++) {
		num=num+parseFloat(days[i][4]);
	}
	return (num/n);
}
//�����sina�õ�����ʷ����
function processHQFuturesData (jsonStr,InstrumentID) {
	print("�յ����ݣ�"+InstrumentID);
	var jsonObj = eval("("+jsonStr+")");
	dailyKLine[InstrumentID] = jsonObj;
	var _date = jsonObj[jsonObj.length-1][0];
	var _close = parseFloat(jsonObj[jsonObj.length-1][4]);
	var _marketData = MarketData[InstrumentID]
	var todayStr = _marketData.TradingDay;
	todayStr = todayStr.substring(0,4)+"-"+ todayStr.substring(4,6)+"-"+ todayStr.substring(6,8);
	//sina���ݣ����ܲ����е��������
	if(todayStr!=_date){
		dailyKLine[InstrumentID] .push([todayStr,_marketData.OpenPrice,_marketData.HighestPrice,_marketData.LowestPrice,_marketData.LastPrice]);
		var _date2 = jsonObj[jsonObj.length-1][0];
		var _close2 = parseFloat(dailyKLine[InstrumentID][dailyKLine[InstrumentID].length-1][4]);
	}
	initDataFromSinaFinished[InstrumentID]=true;//��ס�˺�Լ�Ѿ������������
}

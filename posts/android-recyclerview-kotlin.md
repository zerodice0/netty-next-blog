---
title: 'RecyclerView를 사용하는 방법과, 주의해야 할 점'
Category: Android
author: 'BlackBear'
---

# RecyclerView를 사용하는 방법과, 주의해야 할 점.
## 해보려고 하는 것.
`androidx.recyclerview:recyclerview`를 사용하여 리스트를 화면에 표시하고, 실제로 구현할 때 실수하기 쉬운 것들에 대해 알아보자.

## `Gradle`에 관계성을 추가하자
아래와 같이 app의 `build.gradle`의 dependencies에 한 줄을 추가해주자. 물론 `Add dependency Library`에서 `recyclerview`를 입력해줘도 된다. 어느쪽이건 편한 쪽을 선택하도록 하자.
```
implementation 'androidx.recyclerview:recyclerview:1.1.0'
```

이제 `Gradle Sync`를 하게되면, `RecyclerView`를 사용할 준비는 끝났다.

## 레이아웃을 작성하자.
Activity에 리스트를 표시하기 위해 `RecyclerView`를 추가해주고, 추가로 `RecyclerView` 내부에 추가할 아이템의 레이아웃을 작성해줘야 한다.

다음과 같이 Activity의 레이아웃 파일에 `RecyclerView`를 추가해주도록 하자.
```
<androidx.recyclerview.widget.RecyclerView
  android:id="@+id/recyclerView"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:layout_marginLeft="10dp"
  android:layout_marginRight="10dp"/>
```
Activity의 레이아웃 파일에 `RecyclerView`를 추가했다면, 이제 리스트에 표시될 항목들의 레이아웃을 작성할 차례다. 다음과 같이 list_item.xml 파일을 추가해주자.
```
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:orientation="vertical"
  android:layout_width="match_parent"
  android:layout_height="wrap_content">
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:weightSum="10">
    <TextView
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="3"
      android:textAlignment="center"
      android:text="NAME"/>
    <TextView
      android:id="@+id/text_name"
      android:layout_width="0dp"
      android:textAlignment="center"
      android:layout_height="wrap_content"
      android:layout_weight="7"
      android:text=""/>
  </LinearLayout>
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:weightSum="10">
    <TextView
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="3"
      android:textAlignment="center"
      android:text="ADDRESS"/>
    <TextView
      android:id="@+id/text_address"
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="7"
      android:textAlignment="center"
      android:text=""/>
  </LinearLayout>
</LinearLayout>
```
간단하게 NAME과 ADDRESS를 표시해주는 아이템의 레이아웃이다. 여기에서 약간의 삽질 포인트가 있는데, 아이템 항목의 `layout_height`가 `wrap_content`로 되어있는 것에 주목하자. 처음 xml파일을 생성하면 `layout_height`가 `match_parent`로 지정되어있는데, 이대로 갖다쓰게 되면 리스트에 첫 번째 아이템만 표시된다. ^ ㅈ^)

설마 어떤 바보가 그런 실수를 하겠어, 라고 생각하겠지만 이 글을 적는 이유가 사실 그런 바보짓을 했기 때문에니, 꼭 염두해두도록 하자. (...)

## 데이터 클래스를 만들자
리스트에 표시될 데이터를 클래스 형태로 만들어두자. 예제는 NAME과 ADDRESS만 있으면 되니, 다음과 같이 한 줄만 추가하면 된다.
```
class AddressData(val name:String, val address:String)
```

## 리사이클 뷰의 어댑터와 뷰홀더를 만들자
리사이클 뷰 어댑터(RecycleView.Adapter)는 리스트를 관리해주는 아이다.

뷰홀더(ViewHolder)는 리스트에 표시해줄 각 아이템들에 대한 설정을 대신 해주는 아이다.

백문이 불여일견. 코드를 살펴보자.
```
class AddressListAdapter(addressList: ArrayList<AddressData>) : RecyclerView.Adapter<AddressListAdapter.ViewHolder>() {
  //리스트에 표시할 항목들을 ArrayList의 형태로 저장해둔다.
  private val addressList = addressList 

  override fun getItemCount(): Int = addressList.size

  //onBindViewHolder는 RecyclerView가 데이터를 특정한 위치에 표시할 때 호출된다.
  //여기서는 bind를 호출하여 터치시 토스트 메시지를 출력하게끔 이벤트를 등록해준다.
  override fun onBindViewHolder(holder: ViewHolder, position: Int) {
    val item = addressList[position]
    holder.apply {
      bind(View.OnClickListener {
        Toast.make(applicationContext, "name: ${item.name} / address: ${item.address}", Toast.LENGTH_SHORT).show()
      }, item)
      itemView.tag = item
    }
  }

  //onCreateViewHolder는 새로운 RecyclerView가 뷰 홀더를 생성할 때 호출된다.
  //여기서는 처음에 생성했던 list_item.xml 레이아웃 파일을 이용하여 새 뷰 홀더를 반환하고 있다.
  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
    return ViewHolder(
      LayoutInflater.from(parent.context)
        .inflate(R.layout.list_item, parent, false))
  }

  class ViewHolder(v: View) : RecyclerView.ViewHolder(v) {
    private val view:View = v

    fun bind(listener:View.OnClickListener, item:AddressData) {
      view.text_name.text = item.name
      view.text_address.text = item.address
      view.setOnClickListener(listener)
    }
  }
}
```
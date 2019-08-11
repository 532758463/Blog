const express = require('express');
const async = require('async');
const multer = require('multer');
const axios = require('axios');
const router = express.Router();
router.post("/login",(req,res)=>{
    let d = req.body;
    let sql=`SELECT username,password,id FROM user where username="${d.username}" and password="${md5(d.pwd)}" and status=1 and root=1`;
    conn.query(sql,(err,result)=>{
        if(err){
            console.log(err);
            res.json("db_err")
            return;
        }
        if(result.length===0){
            res.json("u_not");
            return;
        }
        if(result.length!==0){
          
            req.session.aid = result[0].id;
            req.session.aname = result[0].username;
            res.json("success");
            return;
        }
    })
})

// 获取管理员登录信息（检验是否登录）
router.get("/getAdmin",(req,res)=>{
    if(req.session.aid){
        res.send(req.session);
        res.end();
        return;
    }else{
        res.json("a_not")
    }
})
// 管理员退出登录
router.get("/logout",(req,res)=>{
    req.session.destroy();
    // res.json();
    res.send("delete");
})

// 添加博客内容
router.post("/InsertBlog",(req,res)=>{
    let d=req.body;
    // return;
    if(!(d.title&&d.content&&d.img&&d.kinds&&d.desc)){
        res.json("lost");
        return;
    }
    let sql=`INSERT INTO blogs (addtime,bname,bcontent,bimg,kinds,bdesc) VALUE(?,?,?,?,?,?)`;
    let data=[new Date().toLocaleString(),d.title,d.content,d.img,d.kinds,d.desc];
    conn.query(sql,data,(err,result)=>{
        if(err){
            console.log(err)
            res.json({
                r:'fails'
            })
            return;
        }
        res.json({r:'success'});
    })
})

// 添加日记内容：
router.post("/InsertNote",(req,res)=>{
    let d=req.body;
    if(!d.content){
        console.log(d);
        res.json("lost");
        return;
    }
    let t=new Date(new Date().toLocaleString());
    let times=t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); 
    let sql=`INSERT INTO note (addtime,content) VALUE(?,?)`;
    let data=[times,d.content];
    conn.query(sql,data,(err,result)=>{
        if(err){
            console.log(err)
            res.json({
                r:'fails'
            })
            return;
        }
        res.json({r:'success'});
    })
})

// 添加照片墙
// 添加博客内容
router.post("/InsertPic",(req,res)=>{
    let d=req.body;

    if(!(d.content&&d.img)){
        res.json("lost");
        return;
    }
    let sql=`INSERT INTO picwall (addtime,img,moto) VALUE(?,?,?)`;
    let data=[new Date().toLocaleString(),d.img,d.content];
    conn.query(sql,data,(err,result)=>{
        if(err){
            console.log(err)
            res.json({
                r:'fails'
            })
            return;
        }
        res.json({r:'success'});
    })
})

// 获取照片墙的数据
router.post("/getPic",(req,res)=>{
    let sql=`SELECT img,moto,addtime FROM picwall where status=1 limit 10`;
    conn.query(sql,(err,result)=>{
        // console.log(result)
        if(err){
            console.log(err);
            return;
        }
        res.json({
            r:result
        })
    })
})

// 获取日记的数据
router.post("/getNote",(req,res)=>{
    let sql=`SELECT content,addtime FROM note where status=1`;
    conn.query(sql,(err,result)=>{
        // console.log(result)
        if(err){
            console.log(err);
            return;
        }
        res.json({
            r:result
        })
    })
})
router.post("/getTags",(req,res)=>{
    // 每页显示个数
    let pagenum=9;
     // 当前是第几页  默认页数是 1
    //  console.log(req.body)
     let page = req.body.page ? req.body.page : 1;
     (page<1)&&(page=1);
     async.series({
         totalnumbers:function(cb){
            let sql = 'SELECT COUNT(id) AS totalnums FROM blogs';
            conn.query(sql,(err,result)=>{
                // 判断当前页数是否大于总页数
                let totalpages=Math.ceil(result[0].totalnums/pagenum);
                if(page>totalpages){
                    page=totalpages
                }
                cb(null,result[0].totalnums)
            })
         },
         lists:function(cb){
            //  查询从第几条开始查询，后面为限制查询的条数
             let sql=`SELECT * FROM blogs where status=1 limit ?,?`;
             conn.query(sql,[pagenum * (page - 1), pagenum],(err,result)=>{
                //  console.log(result)
                 cb(null,result)
             })
         }
     },(err,data)=>{
        //  传递页数
        data.page=page;
        data.totalpages=Math.ceil(data.totalnumbers/pagenum);
        res.json(data)
     })
})
// 获取分类博客的内容
router.post("/getKinds",(req,res)=>{
    d=req.body.value
    let sql=`SELECT * FROM blogs WHERE kinds like '%${d}%' AND status=1 limit 9`;
    conn.query(sql,(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
        res.json({
            r:result
        })
    })
})
// 获取对应id的博客内容
router.post("/getContent",(req,res)=>{
    d=req.body.id;
    let sql=`SELECT bname,bcontent,kinds,addtime FROM blogs WHERE id=${d} AND status=1`;
    conn.query(sql,(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
        res.json({
            r:result
        })
    })
})
// 获取最新内容
router.get("/getNews",(req,res)=>{
    let sql=`SELECT bname,bimg,addtime,id FROM blogs where status=1 ORDER BY addtime desc limit 3`;
    conn.query(sql,(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
        res.json({
            r:result
        })
    })
})

// 获取评论信息
router.post("/getMsg",(req,res)=>{
    async.series({
        totalLi:function(cb){
            let sql=`SELECT * FROM comment where state=1 and status=1`;
            conn.query(sql,(err,result)=>{
                if(err){
                    console.log(err);
                    return;
                }
                cb(null,result);
            })
        },
        totalChild:function(cb){
            let sql=`SELECT * FROM comment where state=0 and status=1`;
            conn.query(sql,(err,result)=>{
                if(err){
                    console.log(err);
                    return;
                }
                cb(null,result)
            })
        }
    },(err,data)=>{
        res.json(data)
    })
})
// 用户评论信息插入
router.post("/setUserInfo",(req,res)=>{
    let d = req.body;
    // console.log(d);
    let sql=`INSERT INTO comment (addtime,content,username,headimg,state) VALUE(?,?,?,?,?)`;
    let data=[new Date().toLocaleString(),d.editorContent,d.username,d.headimg,1];
    conn.query(sql,data,(err,result)=>{
        if(err){
            console.log(err)
            res.json({r:"db_err"});
            return;
        }
        res.json({r:"success"})
    })
})

// 用户回复信息
router.post("/InsertReply",(req,res)=>{
    let d=req.body;
    console.log(d);
    let sql=`INSERT INTO comment (addtime,bkname,content,username,headimg,reimg,lid) VALUE(?,?,?,?,?,?,?)`;
    let data=[new Date().toLocaleString(),d.bkname,d.content,d.username,d.headimg,d.reimg,d.lid];
    conn.query(sql,data,(err,result)=>{
        if(err){
            console.log(err)
            res.json({r:"db_err"});
            return;
        }
        res.json({r:"success"})
    })
})

router.get("/qqInfo",(req,res)=>{
    let mycb={
        appid:101568689,
         cb:"http%3A%2F%2Fwww.lovexu.cn%2F%23%2Fmycb",
         state:"state"+Math.random()*100+2
    }
    let url="https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id="+mycb.appid+"&redirect_uri="+ mycb.cb+"&state="+mycb.state
    res.json({
        r:url
    })
})
router.get("/getAccessToken",(req,res)=>{
    let d=req.query.code;
    console.log(d)
    let authorization_code=d;
    let code="";
    let mycb={
        appid:101568689,
         cb:"http://www.lovexu.cn/#/mycb",
         state:"state"+Math.random()*100+2,
         appkey:"6685dca80b1e5794d18cf2d7c8401015"
    }
   let url = `https://graph.qq.com/oauth2.0/token? grant_type=${authorization_code}
   &client_id= ${mycb.appid}&client_secret=${mycb.appkey}&redirect_uri=${mycb.cb}&code=${code}`;
   axios({
       method:"get",
       url:url
   }).then(results=>{
       console.log(results);
       let url2=" https://graph.qq.com/user/get_user_info?access_token=" + access_token
       + "&oauth_consumer_key=" + appid + "&openid=" + openid
      axios({
        method:"get",
        url:url2
      }).tnen(uesr=>{
        res.json({
            r:{
                username:user.data.nickname,
                headimg:user.data.figureurl_2
            }
        })
      })
   })
})
module.exports = router;